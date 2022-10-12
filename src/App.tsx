import React, { useEffect, lazy } from 'react'
import { Router, Redirect, Route, Switch } from 'react-router-dom'
import { ResetCSS } from '@lydiafinance/uikit'
import BigNumber from 'bignumber.js'
import useEagerConnect from 'hooks/useEagerConnect'
import { useFetchPriceList, useFetchProfile, useFetchPublicData } from 'state/hooks'
import NftStaking from 'views/NftStaking'
import useGetDocumentTitlePrice from './hooks/useGetDocumentTitlePrice'
import GlobalStyle from './style/Global'
import Menu from './components/Menu'
import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import ToastListener from './components/ToastListener'
import PageLoader from './components/PageLoader'
import EasterEgg from './components/EasterEgg'
import Pools from './views/Pools'
import ComingSoon from './views/ComingSoon'
import Maximus from './views/Maximus'
import Airdrop from './views/Airdrop'
import history from './routerHistory'

// Route-based code splitting
// Only pool is included in the main bundle because of it's the most visited page
const Home = lazy(() => import('./views/Home'))
const Farms = lazy(() => import('./views/Farms'))
const NotFound = lazy(() => import('./views/NotFound'))
const Lottery = lazy(() => import('./views/Lottery'))
const Ifos = lazy(() => import('./views/Ifos'))
// const Collectibles = lazy(() => import('./views/Collectibles'))
// const Teams = lazy(() => import('./views/Teams'))
// const Team = lazy(() => import('./views/Teams/Team'))
// const Profile = lazy(() => import('./views/Profile'))

// This config is required for number formating
BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

const App: React.FC = () => {
  // Monkey patch warn() because of web3 flood
  // To be removed when web3 1.3.5 is released
  useEffect(() => {
    console.warn = () => null
  }, [])

  useEagerConnect()
  useFetchPublicData()
  useFetchProfile()
  useFetchPriceList()
  useGetDocumentTitlePrice()

  return (
    <Router history={history}>
      <ResetCSS />
      <GlobalStyle />
      <Menu>
        <SuspenseWithChunkError fallback={<PageLoader />}>
          <Switch>
            <Route path="/" exact>
              <Home />
            </Route>
            <Route path="/farms">
              <Farms />
            </Route>
            <Route path="/pools">
              <Pools />
            </Route>
            <Route path="/staking">
              <Redirect to="/pools" />
            </Route>
            <Route path="/electrum">
              <Redirect to="/pools" />
            </Route>
            <Route path="/maximizer">
              <Maximus />
            </Route>
            <Route path="/coming-soon">
              <ComingSoon />
            </Route>
            <Route path="/nft-stake">
              <NftStaking />
            </Route>
            {/* <Route path="/airdrop">
              <Airdrop />
            </Route> */}
            <Route path="/lottery">
              <Lottery />
            </Route>
            <Route path="/launchpad">
              <Ifos />
            </Route>
            {/* <Route path="/collectibles">
              <Collectibles />
            </Route> */}
            {/* <Route exact path="/teams">
              <Teams />
            </Route> */}
            {/* Redirect */}
            {/* <Route path="/nft">
              <Redirect to="/collectibles" />
            </Route> */}
            {/* 404 */}
            <Route component={NotFound} />
          </Switch>
        </SuspenseWithChunkError>
      </Menu>
      {/* <EasterEgg iterations={2} /> */}
      <ToastListener />
      {/* <GlobalCheckBullHiccupClaimStatus /> */}
    </Router>
  )
}

export default React.memo(App)
