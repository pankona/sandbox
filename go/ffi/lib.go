package main

/*
#include <stdlib.h>
*/
import "C"
import (
	"fmt"
	"unsafe"
)

var allocatedStrMap = map[*C.char]struct{}{}

//export Hoge
func Hoge() int {
	return 10
}

//export Fuga
func Fuga() *C.char {
	cstr := C.CString("fugafuga")
	allocatedStrMap[cstr] = struct{}{}
	return cstr
}

//export Piyo
func Piyo() *C.char {
	return C.CString("piyopiyo")
}

//export Free
func Free(in *C.char) {
	_, ok := allocatedStrMap[in]
	if !ok {
		return
	}
	C.free(unsafe.Pointer(in))
	delete(allocatedStrMap, in)
}

//export Bar
func Bar(in *C.char) {
	fmt.Println(C.GoString(in))
}
func main() {}
