package main

import "fmt"

func main() {
	d, err := InitializeByWarmHand()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Printf("warm handed: %T, value: %v\n", d, d)

	d, err = InitializeGeneratedByWire()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Printf("wire generated: %T, value: %v\n", d, d)
}
