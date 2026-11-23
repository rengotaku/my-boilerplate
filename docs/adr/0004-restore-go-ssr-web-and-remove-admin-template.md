---
adr: 0004
title: go-ssr-web を戻し、go-react-admin を削除する
status: accepted
superseded_by: null
date: 2026-11-23
issues: [339]
tags: [template-restore, template-removal, go-ssr-web, go-react-admin]
description: #323 で削除した go-ssr-web を戻し、残っていた go-react-admin を削除した。go-react-admin は管理コンソール向けの構成で、ふつうの Go Web アプリの雛形ではなかった
---

# ADR 0004: go-ssr-web を戻し、go-react-admin を削除する

## 背景

#323 で `go-ssr-web` を削除し、`go-react-admin` は残った。リポジトリの持ち主から、次の指示があった。

> go-ssr-web を戻して。admin を消して

## 決定

- **決定 1: `go-ssr-web` を戻した。** `go-ssr-web-minimal` は戻さない。
- **決定 2: `go-react-admin` を削除した。**

## 理由

`go-react-admin` は管理コンソール向けの構成であり、ふつうの Go Web アプリの雛形ではない。そのため、Go で Web を作る用途のテンプレートが無くなっていた。

## 捨てた案

- 両方残す
- 両方消す

## 覆した決定

ADR 0003 の決定のうち、次の 2 つを覆した。

- `go-ssr-web` の削除
- `go-react-admin` の Astryx 化

## 壊すと危ない前提

`go-ssr-web` は React を使わないので、Astryx 前提の対象外である。
