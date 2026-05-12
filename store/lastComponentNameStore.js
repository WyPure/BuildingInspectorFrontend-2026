import { defineStore } from 'pinia'
import { ref } from 'vue'

export const lastComponentNameStore = defineStore('lastComponentName', () => {
  const grandObjectName = ref('')
  const parentObjectName = ref('')
  const objectName = ref('')

  const setGrandObjectName = (val) => {
    grandObjectName.value = val
  }

  const setParentObjectName = (val) => {
    parentObjectName.value = val
  }

  const setObjectName = (val) => {
    objectName.value = val
  }

  return {
    grandObjectName,
    parentObjectName,
    objectName,
    setGrandObjectName,
    setParentObjectName,
    setObjectName
  }
})
