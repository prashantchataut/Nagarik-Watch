/** web-push stub — background push disabled on Workers free preview deploys. */
const webPush = {
  setVapidDetails() {},
  async sendNotification(): Promise<never> {
    throw new Error('Web push is not available on this deployment.')
  },
}

export default webPush
