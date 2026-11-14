export function fieldErrors(error) {
  return error?.response?.data?.errors ?? {}
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message ?? fallback
}
