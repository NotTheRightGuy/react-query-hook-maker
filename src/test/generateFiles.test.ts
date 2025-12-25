import * as assert from 'assert';
import { generateFiles } from '../lib/generateFiles';

suite('generateFiles Test Suite', () => {

    test('should generate simple useQuery hook', async () => {
        const props = {
            featureName: 'getUser',
            methodType: 'GET',
            apiUrl: '/v1/user',
            exampleResponse: '{ "success": true, "data": { "id": 1, "name": "Test" } }',
            params: '',
            hookType: 'useQuery'
        };

        const result = await generateFiles(props);
        
        // Assert Hook
        assert.ok(result.hook.includes('options?: UseQueryOptions<WithResponse<GetUserResponse>>'));
        assert.ok(result.hook.includes("queryKey: getUserKey.keys({ scope: 'getUser' })"));
        
        // Assert Query Key
        assert.ok(result.queryKey.includes("export const getUserKey = {"));
        assert.ok(result.queryKey.includes("scope: 'getUser'"));

        // Assert API
        assert.ok(result.api.includes('export const getUser = async ('));
        assert.ok(result.api.includes('context: QueryFunctionContext<ReturnType<typeof getUserKey.keys>>'));
        assert.ok(result.api.includes('): Promise<WithResponse<GetUserResponse>> => {'));
        
        // Check for cancellation logic
        assert.ok(result.api.includes('const { signal, queryKey } = context;'));
        assert.ok(result.api.includes('source.cancel(`/v1/user - Request cancelled`);'));
    });

    test('should generate useMutation hook with URL variables', async () => {
        const props = {
            featureName: 'updateUser',
            methodType: 'PUT',
            apiUrl: '/v1/user/${userId}',
            exampleResponse: '{ "success": true, "data": { "success": true } }',
            params: '',
            hookType: 'useMutation'
        };

        const result = await generateFiles(props);

        // Assert Hook
        assert.ok(result.hook.includes('export const useUpdateUser = (options?: {'));
        
        // Assert Variables Interface exists
        assert.ok(result.model.includes('export interface UpdateUserVariables {'));
        assert.ok(result.model.includes('userId: number;'));

        // Assert API uses the interface
        assert.ok(result.api.includes('export const updateUser = async ({ userId }: UpdateUserVariables): Promise<WithResponse<UpdateUserResponse>> => {'));
        assert.ok(result.api.includes("getInstance().put(`/v1/user/${userId}`)"));
    });

    test('should throw error for invalid JSON', async () => {
        const props = {
            featureName: 'badData',
            methodType: 'GET',
            apiUrl: '/v1/oops',
            // Missing braces or invalid structure to ensure valid cleanup doesn't save it
            exampleResponse: '{ invalid json }', 
            params: '{{',
            hookType: 'useQuery'
        };

        try {
            await generateFiles(props);
            assert.fail('Should have thrown error');
        } catch (e) {
            assert.ok((e as Error).message.includes('Invalid JSON'));
        }
    });

    test('should generate API with complex params', async () => {
        const props = {
            featureName: 'searchItems',
            methodType: 'POST',
            apiUrl: '/v1/items/search',
            exampleResponse: '{ "success": true, "data": [] }',
            params: '{"query": "foo", "limit": 10}',
            hookType: 'useQuery'
        };

        const result = await generateFiles(props);

        // Assert Types for Params
        assert.ok(result.model.includes('export interface SearchItemsVariables {'));
        assert.ok(result.model.includes('query: string;'));
        assert.ok(result.model.includes('limit: number;'));

        // Assert API uses Context and destructuring
        assert.ok(result.api.includes('export const searchItems = async ('));
        assert.ok(result.api.includes('context: QueryFunctionContext<ReturnType<typeof searchItemsKey.keys>>'));
        assert.ok(result.api.includes('const { query, limit } = queryKey[0];'));
    });
});
