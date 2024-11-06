package main

import (
	"fmt"

	"main/adder"
)

func main() {
	result := adder.Add(2, 3)
	fmt.Println("Result:", result)
	SeedData()
}
