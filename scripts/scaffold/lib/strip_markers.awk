# Strip @scaffold marker regions from a single file.
#
# Usage:
#   awk -v no_auth=0|1 -v no_sample=0|1 -f strip_markers.awk FILE
#
# Markers are comments, so the template itself stays readable and lint-clean.
# Two forms are supported:
#
#   Whole-line block markers (remove a span of lines):
#     # @scaffold:remove-if no-auth        (also: {# @scaffold:remove-if no-auth #})
#     ...lines...
#     # @scaffold:end
#
#   Trailing single-line markers (conditionally drop just that line):
#     from fastapi.responses import HTMLResponse  # @scaffold:keep-if no-sample
#     {# ... #} works the same way inside HTML/Jinja templates.
#
# Conditions: no-auth, no-sample, both (no-auth AND no-sample).
#
# Fail-closed: unbalanced markers, malformed directives and unknown conditions
# abort with exit status 2 so a typo cannot silently keep or drop the wrong code.

function fail(message) {
  printf "scaffold marker error: %s:%d: %s\n", FILENAME, FNR, message > "/dev/stderr"
  failed = 1
  exit 2
}

function condition_met(cond) {
  if (cond == "no-auth") return (no_auth == 1)
  if (cond == "no-sample") return (no_sample == 1)
  if (cond == "both") return ((no_auth == 1 && no_sample == 1) ? 1 : 0)
  fail("unknown condition '" cond "'")
  return 0
}

function trim_marker_tail(text,   out) {
  out = text
  sub(/^[ \t]+/, "", out)
  sub(/[ \t]*[#][}][ \t]*$/, "", out)
  sub(/[ \t]+$/, "", out)
  return out
}

# Parse "remove-if <cond>" / "keep-if <cond>" and return 1 when the line or
# region should be kept. Aborts on anything else.
function directive_keeps(tail,   parts, kind, cond) {
  if (split(tail, parts, /[ \t]+/) != 2) fail("malformed directive: '" tail "'")
  kind = parts[1]
  cond = parts[2]
  if (kind == "remove-if") return (condition_met(cond) ? 0 : 1)
  if (kind == "keep-if") return (condition_met(cond) ? 1 : 0)
  fail("unknown directive '" kind "' (expected remove-if / keep-if / end)")
  return 0
}

{
  line = $0
  position = index(line, "@scaffold:")

  # --- Whole-line block markers -------------------------------------------
  if (line ~ /^[ \t]*([#]|[{][#])[ \t]*@scaffold:/) {
    tail = trim_marker_tail(substr(line, position + 10))
    if (tail == "end") {
      if (depth == 0) fail("unbalanced @scaffold:end")
      if (stack_keeps[depth] == 0) removed--
      delete stack_keeps[depth]
      depth--
      next
    }
    depth++
    stack_keeps[depth] = directive_keeps(tail)
    if (stack_keeps[depth] == 0) removed++
    next
  }

  # --- Trailing single-line markers ---------------------------------------
  if (position > 0) {
    tail = trim_marker_tail(substr(line, position + 10))
    if (tail == "end") fail("trailing @scaffold:end is not supported")

    # Walk back over the marker's comment opener so the kept line does not
    # carry the marker text into the scaffolded project.
    i = position - 1
    while (i > 0 && (substr(line, i, 1) == " " || substr(line, i, 1) == "\t")) i--
    if (i < 1 || substr(line, i, 1) != "#") fail("trailing marker must start with '#' or '{#'")
    start = i
    # Only absorb the '{' when this really is a Jinja comment ({# ... #}).
    # A code line such as `d = {  # @scaffold:...` must keep its brace.
    if (i > 1 && substr(line, i - 1, 1) == "{") {
      candidate = substr(line, i - 1)
      if (candidate ~ /^[{][#].*[#][}][ \t]*$/) start = i - 1
    }

    keep = directive_keeps(tail)
    if (keep == 0 || removed > 0) next

    content = substr(line, 1, start - 1)
    sub(/[ \t]+$/, "", content)
    print content
    next
  }

  # --- Plain line ----------------------------------------------------------
  if (removed == 0) print line
}

END {
  if (failed) exit 2
  if (depth != 0) {
    printf "scaffold marker error: unbalanced @scaffold region (depth=%d)\n", depth > "/dev/stderr"
    exit 2
  }
}
