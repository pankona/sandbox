package main

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
)

type S struct {
	ID    string
	Value int
	S2    S2
}

type S2 struct {
	ID string
}

func TestGoCmp(t *testing.T) {

	a := []S{
		{
			ID:    "hoge",
			Value: 1,
			S2:    S2{ID: "fuga"},
		},
	}

	b := []S{
		{
			ID:    "hoge",
			Value: 1,
			S2:    S2{ID: "hoge"},
		},
	}

	// ignore specified field from comparison
	if diff := cmp.Diff(a, b, cmpopts.IgnoreFields(S2{}, "ID")); diff != "" {
		t.Errorf("diff: %s", diff)
	}
}
