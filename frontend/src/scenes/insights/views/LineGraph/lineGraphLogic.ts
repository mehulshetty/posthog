import { kea } from 'kea'
import { TooltipItem } from 'chart.js'
import { GraphDataset } from '~/types'
import { SeriesDatum } from 'scenes/insights/InsightTooltip/insightTooltipUtils'
import type { lineGraphLogicType } from './lineGraphLogicType'

// TODO: Eventually we should move all state from LineGraph into this logic
export const lineGraphLogic = kea<lineGraphLogicType>({
    path: ['scenes', 'insights', 'LineGraph', 'lineGraphLogic'],
    selectors: {
        createTooltipData: [
            () => [],
            () =>
                (tooltipDataPoints: TooltipItem<any>[], filterFn: (s: SeriesDatum) => boolean): SeriesDatum[] => {
                    return tooltipDataPoints
                        ?.map((dp, idx) => {
                            const pointDataset = (dp?.dataset ?? {}) as GraphDataset
                            return {
                                id: idx,
                                dataIndex: dp.dataIndex,
                                datasetIndex: dp.datasetIndex,
                                dotted: !!pointDataset?.dotted,
                                breakdown_value:
                                    pointDataset?.breakdown_value ??
                                    pointDataset?.breakdownValues?.[dp.dataIndex] ??
                                    undefined,
                                compare_label:
                                    pointDataset?.compare_label ??
                                    pointDataset?.compareLabels?.[dp.dataIndex] ??
                                    undefined,
                                action: pointDataset?.action ?? pointDataset?.actions?.[dp.dataIndex] ?? undefined,
                                label: pointDataset?.label ?? pointDataset.labels?.[dp.dataIndex] ?? undefined,
                                color: Array.isArray(pointDataset.borderColor)
                                    ? pointDataset.borderColor?.[dp.dataIndex]
                                    : pointDataset.borderColor,
                                count: pointDataset?.data?.[dp.dataIndex] || 0,
                                filter: pointDataset?.filter ?? {},
                            }
                        })
                        ?.sort((a, b) => {
                            // Sort by descending order and fallback on alphabetic sort
                            return (
                                b.count - a.count ||
                                (a.label === undefined || b.label === undefined ? -1 : a.label.localeCompare(b.label))
                            )
                        })
                        ?.filter(filterFn)
                        ?.map((s, id) => ({
                            ...s,
                            id,
                        }))
                },
        ],
        createVerticalLabels: [
            () => [],
            () =>
                (labels: string[], interval: string): Array<Array<string>> => {
                    function getMonthAndDay(day: string, monthAbbr: string): string {
                        const year = new Date().getFullYear()
                        const month = new Date(`${monthAbbr} 1, ${year}`).getMonth() + 1
                        return month.toString().padStart(2, '0') + '/' + day.padStart(2, '0')
                    }

                    let currentDateValue = ''

                    return (
                        labels?.map((label: string) => {
                            const labelArray = label.toString().split('-')
                            switch (interval) {
                                case 'hour':
                                    labelArray[1] = getMonthAndDay(labelArray[0], labelArray[1])
                                    const yearAndHourArray: string[] = labelArray[2].split(' ')
                                    labelArray[0] = yearAndHourArray[1]
                                    labelArray[1] = labelArray[1] + '/' + yearAndHourArray[0].slice(2)

                                    if (currentDateValue === labelArray[1]) {
                                        return labelArray.slice(0, 1)
                                    } else {
                                        currentDateValue = labelArray[1]
                                        return labelArray.slice(0, 2)
                                    }

                                case 'day':
                                    labelArray[1] = getMonthAndDay(labelArray[0], labelArray[1])
                                    if (currentDateValue === labelArray[2]) {
                                        return labelArray.slice(1, 2)
                                    } else {
                                        currentDateValue = labelArray[2]
                                        return labelArray.splice(1)
                                    }
                                case 'week':
                                    return labelArray
                                case 'month':
                                    return labelArray.slice(1)
                                default:
                                    return [label]
                            }
                        }) || []
                    )
                },
        ],
    },
})
