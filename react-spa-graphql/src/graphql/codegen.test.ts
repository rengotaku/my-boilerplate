/**
 * US4: 型安全なGraphQL操作 - codegen 生成ファイル検証テスト
 *
 * TDD RED フェーズ:
 * - codegen が未実行の場合、これらのテストは FAIL する
 * - `npm run codegen` 実行後（GREEN フェーズ）に PASS に変わる
 *
 * 前提条件: go-graphql-api が localhost:8081 で起動している必要がある
 *
 * 注意: 動的 import は Vite のビルド時解析を避けるため使用せず、
 *       ファイルシステムの存在確認と内容検証で型生成を確認する。
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// 生成ファイルのパス
const GENERATED_FILE_PATH = resolve(
  __dirname,
  'generated/graphql.ts',
)

// 生成ファイルの内容を読み込む（存在する場合のみ）
function readGeneratedFile(): string | null {
  if (!existsSync(GENERATED_FILE_PATH)) {
    return null
  }
  return readFileSync(GENERATED_FILE_PATH, 'utf-8')
}

describe('US4: GraphQL codegen 生成ファイルの検証', () => {
  describe('生成ファイルの存在確認', () => {
    it('codegen により src/graphql/generated/graphql.ts が生成されること', () => {
      // codegen 未実行時は FAIL する（RED フェーズ）
      // `npm run codegen` 実行後に PASS になる（GREEN フェーズ）
      expect(
        existsSync(GENERATED_FILE_PATH),
        `生成ファイルが存在しません: ${GENERATED_FILE_PATH}\n` +
          '解決方法: go-graphql-api を起動してから `npm run codegen` を実行してください',
      ).toBe(true)
    })
  })

  describe('生成型の内容検証', () => {
    it('User 型が生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // User 型定義が含まれていることを確認
      expect(content).toContain('User')
      expect(content).toContain('name')
      expect(content).toContain('email')
    })

    it('GetUsers Query の型と useGetUsersQuery フックが生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // GetUsers Query の型が含まれていることを確認
      expect(content).toContain('GetUsersQuery')
      // useGetUsersQuery フックが生成されていることを確認
      expect(content).toContain('useGetUsersQuery')
    })

    it('GetUser Query の型と useGetUserQuery フックが生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // GetUser Query の型が含まれていることを確認
      expect(content).toContain('GetUserQuery')
      // useGetUserQuery フックが生成されていることを確認
      expect(content).toContain('useGetUserQuery')
    })

    it('CreateUser Mutation の型と useCreateUserMutation フックが生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // CreateUser Mutation の型が含まれていることを確認
      expect(content).toContain('CreateUserMutation')
      // useCreateUserMutation フックが生成されていることを確認
      expect(content).toContain('useCreateUserMutation')
    })

    it('UpdateUser Mutation の型と useUpdateUserMutation フックが生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // UpdateUser Mutation の型が含まれていることを確認
      expect(content).toContain('UpdateUserMutation')
      // useUpdateUserMutation フックが生成されていることを確認
      expect(content).toContain('useUpdateUserMutation')
    })

    it('DeleteUser Mutation の型と useDeleteUserMutation フックが生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // DeleteUser Mutation の型が含まれていることを確認
      expect(content).toContain('DeleteUserMutation')
      // useDeleteUserMutation フックが生成されていることを確認
      expect(content).toContain('useDeleteUserMutation')
    })

    it('GraphQL Document オブジェクトが生成されること（MSW モック用）', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // GetUsersDocument が生成されていることを確認（MSW GraphQL モックで使用）
      expect(content).toContain('GetUsersDocument')
    })

    it('CreateUserInput 型が生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // CreateUserInput 型が含まれていることを確認
      expect(content).toContain('CreateUserInput')
    })

    it('UpdateUserInput 型が生成されること', () => {
      const content = readGeneratedFile()
      expect(
        content,
        '生成ファイルが存在しません。`npm run codegen` を先に実行してください。',
      ).not.toBeNull()

      // UpdateUserInput 型が含まれていることを確認
      expect(content).toContain('UpdateUserInput')
    })
  })
})
