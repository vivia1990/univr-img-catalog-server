/* eslint-disable padded-blocks */
import { User } from '../../server/models/User.js';
import { test } from 'node:test';
import assert from 'node:assert';

test('User model', async () => {

    await test('User validation', async t => {

        await t.test('User valid', async () => {
            const user = new User('aaa', 'dnv@gmail.com', '12345678');
            const validation = user.validate();
            assert.equal(validation.success, true);

            if (validation.success) {
                assert.deepEqual(user, validation.data);
            } else {
                assert.fail();
            }

        });

        await t.test('User invalid email', async () => {
            const user = new User('aaa', 'bbb', '12345678');
            const validation = user.validate();
            assert.equal(validation.success, false);
            if (!validation.success) {
                assert.equal(validation.error.errors.length, 1);
                validation.error.errors.forEach((error, index) => {
                    assert.equal(error.path[index], 'email');
                });
            }
        });

        await t.test('User invalid email psw', async () => {
            const user = new User('aaa', 'bbb', '12');
            const validation = user.validate();
            assert.equal(validation.success, false);
            const wrFields = ['email', 'password'];
            if (!validation.success) {
                validation.error.errors.forEach((error, index) => {
                    assert.equal(error.path.toString(), wrFields[index]);
                });
            }
        });

    });
});
