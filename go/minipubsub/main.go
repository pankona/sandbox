package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	uuid "github.com/satori/go.uuid"
)

type messageStore struct {
	messages map[string]Message
}

func NewMessageStore() *messageStore {
	return &messageStore{
		messages: map[string]Message{},
	}
}

func (m *messageStore) Save(messages []Message) error {
	for _, message := range messages {
		m.messages[message.mID] = message
	}
	return nil
}
func (m *messageStore) UpdateStatus(mID string, status MessageStatus) error {
	message, ok := m.messages[mID]
	if !ok {
		return fmt.Errorf("not found")
	}
	message.status = status
	m.messages[mID] = message

	return nil
}
func (m *messageStore) FetchPendingMessages() ([]Message, error) {
	ret := []Message{}
	for _, message := range m.messages {
		if message.status == MessageStatusPending {
			ret = append(ret, message)
		}
	}
	return ret, nil
}

type Subscriber interface {
	ID() string
	Topic() string
	OnMessage(message []byte) error
}

type PubSub struct {
	mu sync.Mutex

	subscribers  map[string]Subscriber
	messageStore MessageStore
	onPublishCh  chan struct{}
}

func New(ms MessageStore) *PubSub {
	return &PubSub{
		subscribers:  map[string]Subscriber{},
		messageStore: ms,
		onPublishCh:  make(chan struct{}, 1),
	}
}

type Message struct {
	mID    string
	sID    string
	status MessageStatus

	Topic string
	Body  []byte
}

type MessageStatus int

const (
	MessageStatusPending MessageStatus = iota
	MessageStatusCompleted
	MessageStatusError
)

type MessageStore interface {
	Save(messages []Message) error
	UpdateStatus(mID string, status MessageStatus) error
	FetchPendingMessages() ([]Message, error)
}

func (p *PubSub) Publish(message Message) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	var messages []Message
	for _, s := range p.subscribers {
		if message.Topic == s.Topic() {
			message.mID = uuid.NewV4().String()
			message.sID = s.ID()
			messages = append(messages, message)
		}
	}
	if err := p.messageStore.Save(messages); err != nil {
		return fmt.Errorf("failed to accept publishing: %v", err)
	}

	select {
	case p.onPublishCh <- struct{}{}:
	default:
	}

	return nil
}

func (p *PubSub) Subscribe(s Subscriber) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.subscribers[s.ID()] = s
	return nil
}

func (p *PubSub) Unsubscribe(sid string) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	delete(p.subscribers, sid)
	return nil
}

func (p *PubSub) Run(ctx context.Context) error {
	for {
		messages, err := p.messageStore.FetchPendingMessages()
		if err != nil {
			return fmt.Errorf("fatal: failed to fetch pending messages: %v", err)
		}

		if len(messages) == 0 {
			select {
			case <-time.After(3 * time.Minute):
			case <-p.onPublishCh:
			case <-ctx.Done():
				return nil
			}
			continue
		}

		for _, message := range messages {
			subscriber, ok := p.subscribers[message.sID]
			if !ok {
				// TODO: error handling
				continue
			}
			if subscriber.Topic() == message.Topic {
				err := subscriber.OnMessage(message.Body)
				if err != nil {
					err = p.messageStore.UpdateStatus(message.mID, MessageStatusError)
					if err != nil {
						panic(err)
					}
				}
				err = p.messageStore.UpdateStatus(message.mID, MessageStatusCompleted)
				if err != nil {
					panic(err)
				}
			}
		}
	}
}

type subscriber struct {
	id    string
	topic string
}

func (s *subscriber) ID() string {
	return s.id
}

func (s *subscriber) Topic() string {
	return s.topic
}

func (s *subscriber) OnMessage(message []byte) error {
	fmt.Printf("id: %s, message: %s\n", s.id, string(message))
	return nil
}

func main() {
	pubsub := New(NewMessageStore())

	var (
		subscriber1 = &subscriber{id: "subscriber1", topic: "topic1"}
		subscriber2 = &subscriber{id: "subscriber2", topic: "topic1"}
		subscriber3 = &subscriber{id: "subscriber3", topic: "topic1"}
	)

	if err := pubsub.Subscribe(subscriber1); err != nil {
		fmt.Printf("failed to subscribe: %v\n", err)
	}
	if err := pubsub.Subscribe(subscriber2); err != nil {
		fmt.Printf("failed to subscribe: %v\n", err)
	}
	if err := pubsub.Subscribe(subscriber3); err != nil {
		fmt.Printf("failed to subscribe: %v\n", err)
	}

	go func() {
		err := pubsub.Run(context.Background())
		if err != nil {
			fmt.Printf("Run finished with error: %v\n", err)
		}
	}()

	if err := pubsub.Publish(Message{Topic: "topic1", Body: []byte("hoge")}); err != nil {
		fmt.Printf("failed to publish: %v\n", err)
	}
	if err := pubsub.Publish(Message{Topic: "topic1", Body: []byte("fuga")}); err != nil {
		fmt.Printf("failed to publish: %v\n", err)
	}
	if err := pubsub.Publish(Message{Topic: "topic3", Body: []byte("hoge")}); err != nil {
		fmt.Printf("failed to publish: %v\n", err)
	}

	time.Sleep(1 * time.Second)
}
