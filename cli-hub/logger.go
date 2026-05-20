package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type LogLevel int

const (
	LogDebug LogLevel = iota
	LogInfo
	LogWarn
	LogError
)

func (l LogLevel) String() string {
	switch l {
	case LogDebug:
		return "DEBUG"
	case LogInfo:
		return "INFO"
	case LogWarn:
		return "WARN"
	case LogError:
		return "ERROR"
	default:
		return "????"
	}
}

type Logger struct {
	mu       sync.Mutex
	filePath string
	minLevel LogLevel
}

var appLogger *Logger

func InitLogger(appDir string, debug bool) {
	dbDir := filepath.Join(appDir, "db")
	os.MkdirAll(dbDir, 0755)

	minLevel := LogInfo
	if debug {
		minLevel = LogDebug
	}

	appLogger = &Logger{
		filePath: filepath.Join(dbDir, "app.log"),
		minLevel: minLevel,
	}

	appLogger.write(LogInfo, "logger started minLevel="+minLevel.String())
}

func LogDebugf(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.logf(LogDebug, format, args...)
	}
}

func LogInfof(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.logf(LogInfo, format, args...)
	}
}

func LogWarnf(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.logf(LogWarn, format, args...)
	}
}

func LogErrorf(format string, args ...interface{}) {
	if appLogger != nil {
		appLogger.logf(LogError, format, args...)
	}
}

func (l *Logger) logf(level LogLevel, format string, args ...interface{}) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if level < l.minLevel {
		return
	}
	l.write(level, fmt.Sprintf(format, args...))
}

func (l *Logger) write(level LogLevel, msg string) {
	line := fmt.Sprintf("%s [%-5s] %s\n",
		time.Now().UTC().Format("2006-01-02T15:04:05.000Z"),
		level.String(),
		msg,
	)

	f, err := os.OpenFile(l.filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	f.WriteString(line)

	fi, _ := f.Stat()
	if fi != nil && fi.Size() > 512*1024 {
		l.rotate()
	}
}

func (l *Logger) rotate() {
	data, err := os.ReadFile(l.filePath)
	if err != nil || len(data) <= 256*1024 {
		return
	}
	keep := data[len(data)-256*1024:]
	for i := 0; i < len(keep); i++ {
		if keep[i] == '\n' {
			os.WriteFile(l.filePath, keep[i+1:], 0644)
			return
		}
	}
}

func GetLogPath() string {
	if appLogger == nil {
		return ""
	}
	return appLogger.filePath
}
