import MobileDetect from 'mobile-detect'

export default({ app, store }) => {
    const md = new MobileDetect(window.navigator.userAgent)
    const isMobile = md.phone() !== null || md.mobile() === 'UnknownMobile'
    const isTablet = md.tablet() !== null || md.mobile() === 'UnknownTablet'
    const isDesktop = !isMobile && !isTablet

    store.commit('setDevice', {
        isMobile,
        isTablet,
        isDesktop,
    })
}
