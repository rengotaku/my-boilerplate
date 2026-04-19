package web

import "embed"

//go:embed templates templates/users static static/css static/icons
var FS embed.FS
