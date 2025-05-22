<template>
  <div class="m-auto w-100 p-5" style="max-width: 35rem">
    <BCard class="p-4" title="Welcome back">
      <BCardText>
        <BForm class="text-center" @submit.prevent="submit(!v$.$invalid)">
          <div>
            <div class="field">
              <BFormInput
                id="username"
                v-model="user.username"
                :invalid="v$.user.username.$invalid && submitted"
                placeholder="Username"
                fluid
              />
              <small
                v-if="
                  (v$.user.username.$invalid && submitted) || v$.user.username.$pending.$response
                "
                class="p-error"
                ><br />{{ v$.user.username.required.$message }}</small
              >
            </div>

            <div class="field">
              <BFormInput
                id="password"
                v-model="user.password"
                type="password"
                :invalid="v$.user.password.$invalid && submitted"
                toggle-mask
                placeholder="Password"
                :feedback="false"
                fluid
              />
              <small
                v-if="
                  (v$.user.password.$invalid && submitted) || v$.user.password.$pending.$response
                "
                class="p-error"
                ><br />{{ v$.user.password.required.$message }}</small
              >
            </div>

            <div class="field">
              <BFormInput
                id="totp"
                v-model="user.totp"
                type="text"
                :invalid="v$.user.totp.$invalid && submitted"
                toggle-mask
                placeholder="TOTP (only if enabled)"
                :feedback="false"
                fluid
              />
              <small
                v-if="(v$.user.totp.$invalid && submitted) || v$.user.totp.$pending.$response"
                class="p-error"
              ></small>
            </div>

            <BButton type="submit" class="mt-3"><i class="ri-login-circle-line"></i> Login</BButton>
          </div>
        </BForm>
      </BCardText>
    </BCard>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, maxLength, numeric, minValue } from '@vuelidate/validators'
import { useUserStore } from '@/renderer/stores/user'
import logger from '@/renderer/logging'

export default {
  setup: () => ({
    v$: useVuelidate(),
    userStore: useUserStore()
  }),
  data: () => ({
    user: {
      username: '',
      password: '',
      totp: ''
    },
    submitted: false
  }),
  validations: {
    user: {
      username: { required, maxLength: maxLength(250) },
      password: { required, maxLength: maxLength(250) },
      totp: { numeric, maxLength: maxLength(6), minValue: minValue(0) }
    }
  },
  mounted() {
    if (this.userStore.isLoggedIn) {
      logger.default.info('already logged in, redirecting...')
      this.$router.push({ name: 'chats' })
    }
  },
  methods: {
    submit(isFormValid) {
      this.submitted = true

      if (!isFormValid) {
        return
      }

      this.userStore
        .login(this.user.username, this.user.password, this.user.totp)
        .then((result) => {
          // we have logged in yippeee
          logger.default.info('Login success', result)
          this.$router.push({ name: 'home' })
        })
        .catch((error) => {
          logger.default.error('Login failed', error)
        })
    }
  }
}
</script>
