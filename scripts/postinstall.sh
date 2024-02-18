#!/usr/bin/env bash

set -euo pipefail

# tsconfig

function get_node_major_version() {
    local package_json_path=$1
    local node_version
    node_version=$(jq -r '.volta.node' "$package_json_path")
    echo "${node_version%%.*}"
}

function copy_tsconfig() {
    local tsconfig_path=$1
    local output_path=$2
    local tsconfig_list
    local latest_tsconfig
    tsconfig_list="$(find "$tsconfig_path" -name tsconfig.json || echo '')"
    latest_tsconfig="$(echo "$tsconfig_list" | sort -r | head -n 1)"
    latest_tsconfig="$(echo -e "$latest_tsconfig" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

    if [[ "$latest_tsconfig" != '' ]]; then
        echo "Copying $latest_tsconfig to $output_path."
        echo "// $latest_tsconfig" >"$output_path"
        cat "$latest_tsconfig" >>"$output_path"
    else
        echo "Could not find $tsconfig_path."
        exit 1
    fi
}

function insert_extends() {
    local config_path=$1
    sed -i -e '3i\
  "extends": "./tsconfig.node.json",\
' "$config_path"
}

node_major_version=$(get_node_major_version 'package.json')

mkdir -p config/code
copy_tsconfig "node_modules/@tsconfig/node$node_major_version" 'config/code/tsconfig.node.json'
copy_tsconfig 'node_modules/@tsconfig/strictest' 'config/code/tsconfig.base.json'
insert_extends 'config/code/tsconfig.base.json'
