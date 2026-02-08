# Leafgon-Hosted Leafgraphs

This guide explains how to reference leafgraphs hosted on leafgon.com.

## Address format

Use the graph domain and appid hosted by LEAFgon.

- `<domain>/<appid>`
- `<domain>` (defaults to `/<domain>/index`)
- `/<appid>` (defaults to the current host domain)

## Examples

- `breezyforest/testbed`
- `breezyforest`
- `/testbed`

## How it resolves

Leafgon-hosted leafgraphs are fetched from the LEAFgon GraphQL service configured in your runtime.

## Notes

- Domains and appids are lowercased by the leafgraph address parser.
- Loading leafgon-hosted graphs requires network access and valid LEAFgon endpoints.
