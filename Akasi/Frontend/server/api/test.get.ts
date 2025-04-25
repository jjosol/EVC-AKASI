import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return {
    message: 'API endpoint is working!'
  }
})