import React from 'react'
import { Box, Flex, Text } from '@lydiafinance/uikit'
import { useTranslation } from 'contexts/Localization'
import { useWeb3React } from '@web3-react/core'
import UnlockButton from 'components/UnlockButton'
import { useGetApiPrice } from 'state/hooks'
import useLastUpdated from 'hooks/useLastUpdate'
import useGetVaultUserInfo from 'hooks/lydVault/useGetVaultUserInfo'
import useGetVaultSharesInfo from 'hooks/lydVault/useGetVaultSharesInfo'
import useGetVaultFees from 'hooks/lydVault/useGetVaultFees'
import { Pool } from 'state/types'
import AprRow from '../PoolCard/AprRow'
import StyledCard from '../PoolCard/StyledCard'
import CardFooter from '../PoolCard/CardFooter'
import StyledCardHeader from '../PoolCard/StyledCardHeader'
import VaultCardActions from './VaultCardActions'
import UnstakingFeeCountdownRow from './UnstakingFeeCountdownRow'
import RecentLydProfitRow from '../Shared/RecentLydProfitRow'
import SharedCardBody from '../Shared/SharedCardBody'

interface LydVaultProps {
  pool: Pool
  showStakedOnly?: boolean
  isHomeCard?: boolean
}

const LydVaultCard: React.FC<LydVaultProps> = ({ pool, showStakedOnly, isHomeCard }) => {
  const { t } = useTranslation()
  const { account } = useWeb3React()
  const { lastUpdated, setLastUpdated } = useLastUpdated()
  const userInfo = useGetVaultUserInfo(lastUpdated)
  const vaultFees = useGetVaultFees()
  const { totalLydInVault, pricePerFullShare } = useGetVaultSharesInfo()
  const { stakingToken } = pool
  //   Estimate & manual for now. 288 = once every 5 mins. We can change once we have a better sense of this
  const timesCompoundedDaily = 288
  const accountHasSharesStaked = userInfo.shares && userInfo.shares.gt(0)
  const stakingTokenPrice = useGetApiPrice(stakingToken?.symbol?.toLowerCase())
  const isLoading = !pool.userData || !userInfo.shares
  const performanceFeeAsDecimal = vaultFees.performanceFee && parseInt(vaultFees.performanceFee, 10) / 100

  if (showStakedOnly && !accountHasSharesStaked) {
    return null
  }

  return (
    <StyledCard isStaking={accountHasSharesStaked} isHomeCard={isHomeCard}>
      <StyledCardHeader isAutoVault earningTokenSymbol="LYD" stakingTokenSymbol="LYD" />
      <SharedCardBody isLoading={isLoading}>
        <AprRow
          pool={pool}
          stakingTokenPrice={stakingTokenPrice}
          isAutoVault
          compoundFrequency={timesCompoundedDaily}
          performanceFee={performanceFeeAsDecimal}
        />
        <Box mt="24px">
          <RecentLydProfitRow
            lydAtLastUserAction={userInfo.lydAtLastUserAction}
            userShares={userInfo.shares}
            pricePerFullShare={pricePerFullShare}
          />
        </Box>
        <Box mt="8px">
          <UnstakingFeeCountdownRow
            withdrawalFee={vaultFees.withdrawalFee}
            withdrawalFeePeriod={vaultFees.withdrawalFeePeriod}
            lastDepositedTime={accountHasSharesStaked && userInfo.lastDepositedTime}
          />
        </Box>
        <Flex mt="24px" flexDirection="column">
          {account ? (
            <VaultCardActions
              pool={pool}
              userInfo={userInfo}
              pricePerFullShare={pricePerFullShare}
              vaultFees={vaultFees}
              stakingTokenPrice={stakingTokenPrice}
              accountHasSharesStaked={accountHasSharesStaked}
              lastUpdated={lastUpdated}
              setLastUpdated={setLastUpdated}
              isLoading={isLoading}
            />
          ) : (
            <>
              <Text mb="10px" textTransform="uppercase" fontSize="12px" color="textSubtle" bold>
                {t('Start earning')}
              </Text>
              <UnlockButton />
            </>
          )}
        </Flex>
      </SharedCardBody>
      <CardFooter
        pool={pool}
        account={account}
        performanceFee={vaultFees.performanceFee}
        isAutoVault
        totalLydInVault={totalLydInVault}
      />
    </StyledCard>
  )
}

export default LydVaultCard
