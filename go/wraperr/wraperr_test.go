package wraperr

import (
	"errors"
	"fmt"
)

var (
	ErrPrimitive1 = errors.New("ErrPrimitive1")
	ErrPrimitive2 = errors.New("ErrPrimitive2")
	ErrPrimitive3 = errors.New("ErrPrimitive3")
	ErrPrimitive4 = errors.New("ErrPrimitive4")
)

type myErr1 struct {
	msg string
}

func (e *myErr1) Error() string {
	return e.msg
}

type myErr2 struct {
	msg  string
	code int
}

func (e *myErr2) Error() string {
	return e.msg
}

func Example() {
	err := New(ErrPrimitive1)
	fmt.Println("wrap:", err)
	err = err.Wrap(ErrPrimitive2)
	fmt.Println("wrap:", err)
	err = err.Wrap(ErrPrimitive3)
	fmt.Println("wrap:", err)
	err = err.Wrap(&myErr1{msg: "my error"})
	fmt.Println("wrap:", err)

	fmt.Println("errors.Is(err, ErrPrimitive1):", errors.Is(err, ErrPrimitive1))
	fmt.Println("errors.Is(err, ErrPrimitive2):", errors.Is(err, ErrPrimitive2))
	fmt.Println("errors.Is(err, ErrPrimitive3):", errors.Is(err, ErrPrimitive3))
	fmt.Println("errors.Is(err, ErrPrimitive4):", errors.Is(err, ErrPrimitive4))

	var me1 *myErr1
	fmt.Println("errors.As(err, *myErr1):", errors.As(err, &me1))
	fmt.Println("*myErr.msg:", me1.msg)

	var me2 *myErr2
	fmt.Println("errors.As(err, *myErr2):", errors.As(err, &me2))

	// Output:
	// wrap: ErrPrimitive1
	// wrap: ErrPrimitive2
	// wrap: ErrPrimitive3
	// wrap: my error
	// errors.Is(err, ErrPrimitive1): true
	// errors.Is(err, ErrPrimitive2): true
	// errors.Is(err, ErrPrimitive3): true
	// errors.Is(err, ErrPrimitive4): false
	// errors.As(err, *myErr1): true
	// *myErr.msg: my error
	// errors.As(err, *myErr2): false
}
