package ui

import "fmt"

const (
	Reset  = "\033[0m"
	Bold   = "\033[1m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Cyan   = "\033[36m"
	Gray   = "\033[90m"
)

func Success(format string, a ...interface{}) {
	fmt.Printf(Green+"[✓] "+Reset+format+"\n", a...)
}

func Info(format string, a ...interface{}) {
	fmt.Printf(Blue+"[i] "+Reset+format+"\n", a...)
}

func Warning(format string, a ...interface{}) {
	fmt.Printf(Yellow+"[!] "+Reset+format+"\n", a...)
}

func Error(format string, a ...interface{}) {
	fmt.Printf(Red+"[✗] "+Reset+format+"\n", a...)
}

func BoldText(text string) string {
	return Bold + text + Reset
}

func GreenText(text string) string {
	return Green + text + Reset
}

func RedText(text string) string {
	return Red + text + Reset
}
