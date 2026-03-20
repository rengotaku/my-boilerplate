package web

import "embed"

//go:embed templates templates/users static static/css
var FS embed.FS
