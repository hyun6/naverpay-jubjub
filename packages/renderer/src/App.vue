<script lang="ts" setup>
import { NAVER_ID, NAVER_PWD, NAVER_ID2, NAVER_PWD2, getStore, jubjub, setStore } from '#preload';
import { onMounted, ref } from 'vue';

const naverId = ref<string>('');
const naverPwd = ref<string>('');
const naverId2 = ref<string>('');
const naverPwd2 = ref<string>('');

const url = ref<string>('');

onMounted(() => {
  // 저장된 아이디 패스워드 자동 입력
  naverId.value = getStore(NAVER_ID);
  naverPwd.value = getStore(NAVER_PWD);
  naverId2.value = getStore(NAVER_ID2);
  naverPwd2.value = getStore(NAVER_PWD2);

  console.log(`init id: ${naverId.value} pwd: ${naverPwd.value}`);
  console.log(`init id2: ${naverId2.value} pwd2: ${naverPwd2.value}`);

  // 줍줍 url 에디트에 포커스 주기
  const urlInput = document.getElementById('url');
  if (urlInput) {
    urlInput.focus();
  }
});

const onClickJubjub = async () => {
  setStore(NAVER_ID, naverId.value);
  setStore(NAVER_PWD, naverPwd.value);
  await jubjub(url.value, naverId.value, naverPwd.value);

  setStore(NAVER_ID2, naverId2.value);
  setStore(NAVER_PWD2, naverPwd2.value);
  await jubjub(url.value, naverId2.value, naverPwd2.value);

  onClickConfirm();
};

const onClickConfirm = () => {
  window.open('https://new-m.pay.naver.com/pointshistory/list?category=all', '_blank');
};
</script>

<template>
  <div>
    <!-- 네이버 아이디와 비번을 입력 -->
    <div>
      <label>네이버 계정</label>
      <input
        id="naver-id"
        v-model="naverId"
        placeholder="아이디"
        type="text"
      />
      <input
        id="naver-pwd"
        v-model="naverPwd"
        placeholder="비번"
        type="password"
      />
    </div>
    <div>
      <label>네이버 계정2</label>
      <input
        id="naver-id2"
        v-model="naverId2"
        placeholder="아이디"
        type="text"
      />
      <input
        id="naver-pwd2"
        v-model="naverPwd2"
        placeholder="비번"
        type="password"
      />
    </div>
    <!-- url 입력 -->
    <div>
      <label>줍줍 url</label>
      <input
        id="url"
        v-model="url"
        type="text"
        @keydown.enter="onClickJubjub"
      />
      <button @click="onClickJubjub">줍줍!</button>
    </div>
    <button @click="onClickConfirm">줍줍 확인</button>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 60px auto;
  max-width: 700px;
}

fieldset {
  margin: 2rem;
  padding: 1rem;
}
</style>
