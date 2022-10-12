/* eslint-disable react/jsx-curly-brace-presence */
import React from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import { Flex, Text, TooltipText, LinkExternal, Skeleton, useTooltip } from '@lydiafinance/uikit'
import { BASE_AVAX_SCAN_URL } from 'config'
import { useGetApiPrice } from 'state/hooks'
import { Maximus } from 'state/types'
import { getAddress } from 'utils/addressHelpers'

interface ExpandedFooterProps {
  pool: Maximus
  account: string
  performanceFee?: number
  isAutoVault?: boolean
  totalLydInVault?: BigNumber
}

const ExpandedWrapper = styled(Flex)`
  svg {
    height: 14px;
    width: 14px;
  }
`

const ExpandedFooter: React.FC<ExpandedFooterProps> = ({ pool, performanceFee = 0 }) => {
  const { t } = useTranslation()
  const { totalStaked, contractAddress, lpSymbol, quoteToken, lpTotalInQuoteTokenNew } = pool

  const poolContractAddress = getAddress(contractAddress)
  const { targetRef, tooltip, tooltipVisible } = useTooltip(
    t('Subtracted automatically from each yield harvest and burned.'),
    { placement: 'bottom-end' },
  )

  const quoteTokenPriceUsd = useGetApiPrice(quoteToken.symbol.toLowerCase())
  const totalLiquidity = new BigNumber(lpTotalInQuoteTokenNew).times(quoteTokenPriceUsd)

  const totalValueFormatted = totalLiquidity
    ? `$${totalLiquidity.toNumber().toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : '-'

  return (
    <ExpandedWrapper flexDirection="column">
      <Flex mb="2px" justifyContent="space-between" alignItems="center">
        <Text small>{t('Total staked:')}</Text>
        <Flex alignItems="flex-start">
          {totalStaked ? (
            <>
              {totalValueFormatted}
              <Text ml="4px" fontSize="14px">
                {lpSymbol}
              </Text>
            </>
          ) : (
            <Skeleton width="90px" height="21px" />
          )}
        </Flex>
      </Flex>

      <Flex mb="2px" justifyContent="space-between" alignItems="center">
        {tooltipVisible && tooltip}
        <TooltipText ref={targetRef} small>
          {t('Performance Fee (Maximus)')}
        </TooltipText>
        <Flex alignItems="center">
          <Text ml="4px" small>
            {performanceFee / 100}%
          </Text>
        </Flex>
      </Flex>

      <Flex mb="2px" justifyContent="space-between" alignItems="center">
        {tooltipVisible && tooltip}
        <TooltipText ref={targetRef} small>
          {t('Performance Fee (Auto-LYD)')}
        </TooltipText>
        <Flex alignItems="center">
          <Text ml="4px" small>
            6%
          </Text>
        </Flex>
      </Flex>

      <Flex mb="2px" justifyContent="flex-end">
        <LinkExternal bold={false} small href={`https://exchange.lydia.finance/#/pool`}>
          {t(`Get  ${lpSymbol}`)}
        </LinkExternal>
      </Flex>

      {poolContractAddress && (
        <Flex mb="2px" justifyContent="flex-end">
          <LinkExternal bold={false} small href={`${BASE_AVAX_SCAN_URL}/address/${poolContractAddress}`}>
            {t('View Contract')}
          </LinkExternal>
        </Flex>
      )}

      <Flex mb="2px" justifyContent="flex-end">
        <LinkExternal bold={false} small href={`${BASE_AVAX_SCAN_URL}/address/${poolContractAddress}`}>
          {t('See Pair Info')}
        </LinkExternal>
      </Flex>
    </ExpandedWrapper>
  )
}

export default React.memo(ExpandedFooter)
