import ElectronStore from 'electron-store';

export const NAVER_ID = 'naverId';
export const NAVER_PWD = 'naverPwd';
export const NAVER_ID2 = 'naverId2';
export const NAVER_PWD2 = 'naverPwd2';

const store = new ElectronStore({
  schema: {
    NAVER_ID: { type: 'string' },
    NAVER_PWD: { type: 'string' },
    NAVER_ID2: { type: 'string' },
    NAVER_PWD2: { type: 'string' },
  },
});

export function getStore(key: string): string {
  return store.get(key);
}

export function setStore(key: string, value: string) {
  store.set(key, value);
}
