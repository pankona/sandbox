package main

import (
	"flag"
	"fmt"
)

var participants = []string{
	":kachick:",
	":pankona:",
	":lgtm_mpls104:",
	":highwide:",
	":motorollerscalatron:",
}

var charge = []string{
	"easy-mark",
	"easy-mark-frontend",
	"aya-coaches-react",
	"ファシリ",
	"aya-coaching",
}

func main() {
	var rotation *int
	rotation = flag.Int("rotation", 0, "rotation number")
	flag.Parse()
	for i := range participants {
		fmt.Printf("%v: %v\n", participants[i], charge[index(len(charge), -(*rotation)+i)])
	}
}

func index(max, value int) int {
	if value%max < 0 {
		return value%max + max
	}
	return value % max
}
