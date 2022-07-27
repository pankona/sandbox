package wraperr

import "errors"

type wrapErr struct {
	next *wrapErr
	err  error
}

func New(err error) *wrapErr {
	return &wrapErr{err: err}
}

func (we *wrapErr) Error() string {
	if we == nil {
		return "error is empty"
	}
	return we.err.Error()
}

func (we *wrapErr) Unwrap() error {
	if we == nil {
		return nil
	}
	return we.next
}

func (we *wrapErr) Is(target error) bool {
	if we == nil {
		return false
	}
	return errors.Is(we.err, target)
}

func (we *wrapErr) As(target any) bool {
	if we == nil {
		return false
	}
	return errors.As(we.err, target)
}

func (we *wrapErr) Wrap(err error) *wrapErr {
	return &wrapErr{
		next: we,
		err:  err,
	}
}

func (we *wrapErr) Err() error {
	return we.err
}
