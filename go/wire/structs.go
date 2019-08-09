package main

type (
	A struct{}
	B struct{}
	C struct{}
	D struct{}
)

func NewA() (*A, error) {
	return &A{}, nil
}

func NewB(a *A) *B {
	return &B{}
}

func NewC() *C {
	return &C{}
}

func NewD(b *B, c *C) (*D, error) {
	return &D{}, nil
}

// InitializeByWarmHand is 俺が考えた最強の初期化関数
func InitializeByWarmHand() (*D, error) {
	a, err := NewA()
	if err != nil {
		return nil, err
	}
	b := NewB(a)
	c := NewC()
	d, err := NewD(b, c)
	if err != nil {
		return nil, err
	}
	return d, nil
}
