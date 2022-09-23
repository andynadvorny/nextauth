import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { parseCookies, setCookie } from 'nookies'

import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from '../errors/AuthTokenError';

interface AxiosErrorResponse {
  code?: string;
}

interface FailedRequestsQueue {
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError) => void;
}

let isRefreshing = false
let failedRequestsQueue: FailedRequestsQueue[] = []

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })
  
  api.interceptors.response.use(response => {
    return response; // if success 
  }, (error: AxiosError<AxiosErrorResponse>) => {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        cookies = parseCookies()
  
        const { 'nextauth.refreshToken': refreshToken } = cookies
        const originalConfig: AxiosRequestConfig = error.config
  
        if (!isRefreshing) {
          isRefreshing = true
  
          api.post('/refresh', {
            refreshToken
          }).then(response => {
            const { token } = response.data
    
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/' // global access to all app
            })
            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/'
            })
    
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  
            failedRequestsQueue.forEach((request) => request.onSuccess(token))
            failedRequestsQueue = []
          }).catch(err => {
            failedRequestsQueue.forEach((request) => request.onFailure(err))
            failedRequestsQueue = []
  
            if (typeof window === "undefined") {
              signOut()
            } else {
              return Promise.reject(new AuthTokenError)
            }
          }).finally(() => {
            isRefreshing = false
          })
        }
  
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              if (!originalConfig.headers) {
                throw new Error('Execution error')
              }
              
              originalConfig.headers['Authorization'] = `Bearer ${token}`
  
              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            },
          })
        })
      } else {
        if (typeof window === "undefined") {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError)
        }
      }
    }
  
    return Promise.reject(error)
  })

  return api
}