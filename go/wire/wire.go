// +build wireinject

package main

import "github.com/google/wire"

func InitializeGeneratedByWire() (*D, error) {
	wire.Build(NewA, NewC, NewB, NewD)
	return &D{}, nil
}
