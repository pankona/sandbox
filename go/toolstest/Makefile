
all:
	go mod tidy
	for i in `cat tools/tools.go | grep _ | cut -b 4- | xargs -n1 echo`; do go install $$i; done
