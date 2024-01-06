import ElectronStore from 'electron-store';

export const NAVER_ID = 'naverId';
export const NAVER_PWD = 'naverPwd';

const store = new ElectronStore({
  schema: {
    NAVER_ID: { type: 'string' },
    NAVER_PWD: { type: 'string' },
  },
});

export function getStore(key: string): string {
  return store.get(key);
}

export function setStore(key: string, value: string) {
  store.set(key, value);
}
