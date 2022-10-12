import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Heading, Card, CardBody, Button } from '@lydiafinance/uikit'
import { useWeb3React } from '@web3-react/core'
import { useTranslation } from 'contexts/Localization'
import { useAllHarvest } from 'hooks/useHarvest'
import useFarmsWithBalance from 'hooks/useFarmsWithBalance'
import UnlockButton from 'components/UnlockButton'
import LydHarvestBalance from './LydHarvestBalance'
import LydWalletBalance from './LydWalletBalance'
import useDeviceSize from '../../../hooks/useWindowSize'

const StyledFarmStakingCard = styled(Card)`
  /* background-image: url('/images/lyd-bg.svg'); */
  background-repeat: no-repeat;
  background-position: top right;
  min-height: 320px;
`

const Block = styled.div`
  margin-bottom: 16px;
  width: 100%;
`

const CardImage = styled.img`
  margin-right: 16px;
  width: 75px;
  height: 75px;
`

const Label = styled.div`
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: 14px;
`

const Actions = styled.div`
  margin-top: 24px;
`

const Wrapper = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ isMobile }) => (isMobile ? 'column' : 'row')};
  width: 100%;
  align-items: unset;
`

const FarmedStakingCard = () => {
  const [pendingTx, setPendingTx] = useState(false)
  const { account } = useWeb3React()
  const { t } = useTranslation()
  const farmsWithBalance = useFarmsWithBalance()
  const balancesWithValue = farmsWithBalance.filter((balanceType) => balanceType.balance.toNumber() > 0)
  const deviceSize = useDeviceSize()
  const { isDesktop, isMobile } = deviceSize

  const { onReward } = useAllHarvest(balancesWithValue.map((farmWithBalance) => farmWithBalance.pid))

  const harvestAllFarms = useCallback(async () => {
    setPendingTx(true)
    try {
      await onReward()
    } catch (error) {
      // TODO: find a way to handle when the user rejects transaction or it fails
    } finally {
      setPendingTx(false)
    }
  }, [onReward])

  return (
    <StyledFarmStakingCard>
      <CardBody>
        <Heading scale="xl" mb="24px">
          {t('Farms & Staking')}
        </Heading>
        <Wrapper isMobile={isMobile}>
          {isDesktop && <CardImage src="/images/lyd.png" alt="lyd logo" width={64} height={64} />}
          <Block>
            <Label>{t('LYD to Harvest')}:</Label>
            <LydHarvestBalance />
          </Block>
          <Block>
            <Label>{t('LYD in Wallet')}:</Label>
            <LydWalletBalance />
          </Block>
        </Wrapper>
        <Actions>
          {account ? (
            <Button
              id="harvest-all"
              disabled={balancesWithValue.length <= 0 || pendingTx}
              onClick={harvestAllFarms}
              width="100%"
            >
              {pendingTx
                ? t('Collecting LYD')
                : t(`Harvest all (${balancesWithValue.length})`, {
                    count: balancesWithValue.length,
                  })}
            </Button>
          ) : (
            <UnlockButton width="100%" />
          )}
        </Actions>
      </CardBody>
    </StyledFarmStakingCard>
  )
}

export default FarmedStakingCard
