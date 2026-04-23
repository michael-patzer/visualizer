#!/usr/bin/env bash

set -euo pipefail

APP_ID=""
PROJECT_ROOT="."
IMAGES_DIR="images"
SIZE_PRIMARY="600x0w.png"
SIZE_FALLBACK="1290x0w.png"
LOCALES_OVERRIDE=""

usage() {
  cat <<'EOF'
Usage:
  scripts/update-appstore-screenshots.sh --app-id <id|url> [--project-root <path>] [--images-dir <path>] [--locales cs,da,...]
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-id)
      APP_ID="${2:-}"
      shift 2
      ;;
    --project-root)
      PROJECT_ROOT="${2:-}"
      shift 2
      ;;
    --images-dir)
      IMAGES_DIR="${2:-}"
      shift 2
      ;;
    --locales)
      LOCALES_OVERRIDE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$APP_ID" ]]; then
  echo "--app-id is required" >&2
  exit 1
fi

if [[ "$APP_ID" =~ id([0-9]{8,}) ]]; then
  APP_ID="${BASH_REMATCH[1]}"
elif [[ ! "$APP_ID" =~ ^[0-9]{8,}$ ]]; then
  echo "Unable to extract numeric App Store ID from: $APP_ID" >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"
DEST_IMAGES_DIR="$PROJECT_ROOT/$IMAGES_DIR"

if [[ ! -d "$DEST_IMAGES_DIR" ]]; then
  echo "Images directory not found: $DEST_IMAGES_DIR" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

USER_AGENT='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

declare -a LOCALES=()
declare -a UNRESOLVED_LOCALES=()

if [[ -n "$LOCALES_OVERRIDE" ]]; then
  while IFS= read -r locale; do
    [[ -n "$locale" ]] || continue
    LOCALES+=("$locale")
  done < <(printf '%s\n' "$LOCALES_OVERRIDE" | tr ',' '\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' | sort)
else
  while IFS= read -r locale; do
    LOCALES+=("$locale")
  done < <(
    find "$PROJECT_ROOT" -mindepth 1 -maxdepth 1 -type d -exec test -f '{}/index.html' ';' -print \
      | xargs -n1 basename \
      | grep -E '^[a-z]{2}(-[A-Z]{2})?$' \
      | sort
  )
fi

if [[ ${#LOCALES[@]} -eq 0 ]]; then
  echo "No locale directories with index.html were found." >&2
  exit 1
fi

lang_for_locale() {
  case "$1" in
    zh-CN) echo "zh-Hans" ;;
    zh-TW) echo "zh-Hant" ;;
    pt-BR) echo "pt-BR" ;;
    nb) echo "nb" ;;
    sv) echo "sv-SE" ;;
    uk) echo "uk" ;;
    *) echo "$1" ;;
  esac
}

storefront_for_locale() {
  case "$1" in
    ar) echo "sa" ;;
    cs) echo "cz" ;;
    da) echo "dk" ;;
    de) echo "de" ;;
    es) echo "es" ;;
    fr) echo "fr" ;;
    hr) echo "hr" ;;
    hu) echo "hu" ;;
    hi) echo "in" ;;
    it) echo "it" ;;
    ja) echo "jp" ;;
    nb|no) echo "no" ;;
    nl) echo "nl" ;;
    pl) echo "pl" ;;
    pt-BR) echo "br" ;;
    ro) echo "ro" ;;
    ru) echo "ru" ;;
    sk) echo "sk" ;;
    sv) echo "se" ;;
    th) echo "th" ;;
    tr) echo "tr" ;;
    uk) echo "ua" ;;
    zh-CN) echo "cn" ;;
    zh-TW) echo "tw" ;;
    en-GB) echo "gb" ;;
    ko) echo "kr" ;;
    *) echo "us" ;;
  esac
}

candidate_pairs_for_locale() {
  local locale="$1"
  local store lang
  store="$(storefront_for_locale "$locale")"
  lang="$(lang_for_locale "$locale")"

  case "$locale" in
    sv)
      printf '%s\n' "se|sv-SE" "us|sv-SE" "se|sv" "us|sv" "se|en-US" "us|en-US"
      ;;
    th)
      printf '%s\n' "th|th" "us|th" "th|th-TH" "us|th-TH" "th|en-US" "us|en-US"
      ;;
    tr)
      printf '%s\n' "tr|tr" "us|tr" "tr|tr-TR" "us|tr-TR" "tr|en-US" "us|en-US"
      ;;
    uk)
      printf '%s\n' "ua|uk" "us|uk" "ua|uk-UA" "us|uk-UA" "ua|en-US" "us|en-US"
      ;;
    cs|da|nb|ro|th|tr)
      printf '%s\n' "${store}|${lang}" "us|${lang}" "${store}|en-US" "us|en-US"
      ;;
    *)
      printf '%s\n' "${store}|${lang}" "us|${lang}" "${store}|en-US" "us|en-US"
      ;;
  esac
}

fetch_html() {
  local storefront="$1"
  local lang="$2"
  local output="$3"
  local url="https://apps.apple.com/${storefront}/app/id${APP_ID}?l=${lang}"

  curl -sS -L --compressed \
    -H 'Accept: text/html' \
    -A "$USER_AGENT" \
    "$url" \
    -o "$output"

  local size
  size="$(wc -c < "$output" | tr -d ' ')"
  [[ "$size" -ge 10000 ]]
}

extract_direct_urls() {
  local html_file="$1"
  local variant="$2"
  local outfile="$3"
  local pattern=""

  case "$variant" in
    iphone69)
      pattern='https://[^"[:space:],]*PurpleSource[^"[:space:],]*(iOS_Phones__6\.9|iPhones__6\.9)-[0-9]+\.png/[0-9]+x[0-9]+bb(-60)?\.(jpg|webp)'
      ;;
    iphone65)
      pattern='https://[^"[:space:],]*PurpleSource[^"[:space:],]*iOS_[^"[:space:],]*6\.5-[0-9]+\.png/[0-9]+x[0-9]+bb(-60)?\.(jpg|webp)'
      ;;
    ipad13)
      pattern='https://[^"[:space:],]*PurpleSource[^"[:space:],]*iPad__13-ipadPro129-[0-9]+\.png/[0-9]+x[0-9]+bb(-60)?\.(jpg|webp)'
      ;;
    *)
      echo "Unknown variant: $variant" >&2
      return 1
      ;;
  esac

  grep -oE "$pattern" "$html_file" \
    | sort -u \
    | perl -ne 'if (/-0*([0-9]+)\.png\/([0-9]+)x([0-9]+)bb(?:-60)?\.(jpg|webp)$/) { print join("|",$1,$2,$4,$_), "\n" }' \
    | sort -t'|' -k1,1n -k2,2nr -k3,3r \
    | awk -F'|' '!seen[$1]++ {print $4}' > "$outfile" || true

  [[ -s "$outfile" ]]
}

extract_templates() {
  local html_file="$1"
  local variant="$2"
  local outfile="$3"
  local pattern=""

  case "$variant" in
    iphone69)
      pattern='https://[^"]*PurpleSource[^"]*(iOS_Phones__6\.9|iPhones__6\.9)-[0-9]+\.png/\{w\}x\{h\}\{c\}\.\{f\}'
      ;;
    iphone65)
      pattern='https://[^"]*PurpleSource[^"]*iOS_[^"]*6\.5-[0-9]+\.png/\{w\}x\{h\}\{c\}\.\{f\}'
      ;;
    ipad13)
      pattern='https://[^"]*PurpleSource[^"]*iPad__13-ipadPro129-[0-9]+\.png/\{w\}x\{h\}\{c\}\.\{f\}'
      ;;
    *)
      echo "Unknown variant: $variant" >&2
      return 1
      ;;
  esac

  grep -oE "$pattern" "$html_file" \
    | sort -u \
    | perl -ne 'if (/-0*([0-9]+)\.png\/\{w\}x\{h\}\{c\}\.\{f\}$/) { print "$1|$_" }' \
    | sort -t'|' -k1,1n \
    | cut -d'|' -f2- > "$outfile" || true

  [[ -s "$outfile" ]]
}

download_image() {
  local url="$1"
  local output="$2"
  local tmp="${output}.download"

  curl -sS -L -A "$USER_AGENT" "$url" -o "$tmp"
  if ! file "$tmp" | grep -Eqi 'PNG image data|JPEG image data|Web/P image|RIFF \(little-endian\) data, Web/P image'; then
    rm -f "$tmp"
    return 1
  fi

  if file "$tmp" | grep -qi 'PNG image data'; then
    mv "$tmp" "$output"
    return 0
  fi

  sips -s format png "$tmp" --out "$output" >/dev/null
  rm -f "$tmp"
  file "$output" | grep -qi 'PNG image data'
}

download_direct_or_template_to_png() {
  local source_url="$1"
  local output="$2"

  if [[ "$source_url" == *"{w}x{h}{c}.{f}"* ]]; then
    local primary_url="${source_url//\{w\}x\{h\}\{c\}\.\{f\}/$SIZE_PRIMARY}"
    local fallback_url="${source_url//\{w\}x\{h\}\{c\}\.\{f\}/$SIZE_FALLBACK}"
    download_image "$primary_url" "$output" || download_image "$fallback_url" "$output"
    return
  fi

  download_image "$source_url" "$output"
}

stage_variant() {
  local html_file="$1"
  local stage_dir="$2"
  local direct_file="$stage_dir/direct.txt"
  local template_file="$stage_dir/template.txt"
  local urls_file="$stage_dir/urls.txt"
  local variant=""
  local found=0

  for variant in iphone69 iphone65 ipad13; do
    : > "$direct_file"
    : > "$template_file"
    extract_direct_urls "$html_file" "$variant" "$direct_file" || true
    extract_templates "$html_file" "$variant" "$template_file" || true

    if [[ -s "$direct_file" || -s "$template_file" ]]; then
      cat "$direct_file" "$template_file" \
        | perl -ne 'if (/-0*([0-9]+)\.png\//) { print "$1|$_" }' \
        | sort -t'|' -k1,1n \
        | awk -F'|' '!seen[$1]++ {print $2}' > "$urls_file"
      found=1
      break
    fi
  done

  if [[ "$found" -ne 1 ]]; then
    return 1
  fi

  rm -f "$stage_dir"/screenshot*.png

  while IFS= read -r source_url; do
    [[ -n "$source_url" ]] || continue
    local num
    num="$(printf '%s\n' "$source_url" | sed -E 's/.*-0*([0-9]+)\.png\/.*/\1/')"
    download_direct_or_template_to_png "$source_url" "$stage_dir/screenshot${num}.png"
  done < "$urls_file"

  local count unique
  count="$(find "$stage_dir" -maxdepth 1 -name 'screenshot*.png' | wc -l | tr -d ' ')"
  [[ "$count" -gt 0 ]] || return 1

  unique="$(
    find "$stage_dir" -maxdepth 1 -name 'screenshot*.png' -print0 \
      | xargs -0 md5 \
      | awk '{print $NF}' \
      | sort -u \
      | wc -l \
      | tr -d ' '
  )"
  [[ "$count" -eq "$unique" ]]
}

replace_destination_dir() {
  local staged_dir="$1"
  local dest_dir="$2"
  mkdir -p "$dest_dir"
  find "$dest_dir" -maxdepth 1 -name 'screenshot*.png' -delete
  while IFS= read -r staged_file; do
    local base
    base="$(basename "$staged_file")"
    mv "$staged_file" "$dest_dir/$base"
  done < <(find "$staged_dir" -maxdepth 1 -name 'screenshot*.png' | sort)
}

rewrite_locale_html() {
  local locale="$1"
  local html_file="$PROJECT_ROOT/$locale/index.html"
  [[ -f "$html_file" ]] || return 0

  perl -0pi -e '
    my $locale = $ENV{"TARGET_LOCALE"};
    s{https://paintcolorvisualizer\.app/images/(?![A-Za-z0-9-]+/)(screenshot\d+\.png)}{"https://paintcolorvisualizer.app/images/$locale/$1"}ge;
    s{(?<!https://paintcolorvisualizer\.app/)images/(?![A-Za-z0-9-]+/)(screenshot\d+\.png)}{"images/$locale/$1"}ge;
  ' "$html_file"
}

root_stage="$TMP_DIR/root"
mkdir -p "$root_stage"
root_html="$TMP_DIR/root.html"

if ! fetch_html "us" "en-US" "$root_html"; then
  echo "Failed to fetch English App Store page for app $APP_ID" >&2
  exit 1
fi

if ! stage_variant "$root_html" "$root_stage"; then
  echo "Failed to extract English screenshots for app $APP_ID" >&2
  exit 1
fi

replace_destination_dir "$root_stage" "$DEST_IMAGES_DIR"
ROOT_HASH="$(md5 -q "$DEST_IMAGES_DIR/screenshot1.png")"
ROOT_COUNT="$(find "$DEST_IMAGES_DIR" -maxdepth 1 -name 'screenshot*.png' | wc -l | tr -d ' ')"

printf 'en %s screenshots\n' "$ROOT_COUNT"

for locale in "${LOCALES[@]}"; do
  locale_stage="$TMP_DIR/$locale"
  mkdir -p "$locale_stage"

  matched=0
  while IFS='|' read -r storefront lang; do
    html_path="$TMP_DIR/${locale}-${storefront}-${lang}.html"
    if ! fetch_html "$storefront" "$lang" "$html_path"; then
      continue
    fi

    if ! stage_variant "$html_path" "$locale_stage"; then
      continue
    fi

    locale_hash="$(md5 -q "$locale_stage/screenshot1.png")"
    if [[ "$locale_hash" == "$ROOT_HASH" ]]; then
      rm -f "$locale_stage"/screenshot*.png
      continue
    fi

    matched=1
    break
  done < <(candidate_pairs_for_locale "$locale")

  if [[ "$matched" -ne 1 ]]; then
    UNRESOLVED_LOCALES+=("$locale")
    echo "warning: unresolved localized screenshots for $locale; leaving existing screenshot references in place" >&2
    continue
  fi

  replace_destination_dir "$locale_stage" "$DEST_IMAGES_DIR/$locale"
  TARGET_LOCALE="$locale" rewrite_locale_html "$locale"
  count="$(find "$DEST_IMAGES_DIR/$locale" -maxdepth 1 -name 'screenshot*.png' | wc -l | tr -d ' ')"
  printf '%s %s screenshots\n' "$locale" "$count"
done

if [[ ${#UNRESOLVED_LOCALES[@]} -gt 0 ]]; then
  printf 'unresolved %s\n' "${UNRESOLVED_LOCALES[*]}" >&2
fi
