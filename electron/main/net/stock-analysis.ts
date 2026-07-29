/**
 * 主进程侧再导出：分析逻辑已下沉到 shared，供渲染进程本地重算买卖信号。
 */
export {
  queryAnalyzeStockChart,
  queryApplyLiveQuote,
  queryBuildRealtimeAnalysisContext,
  queryExtractTradeSignals,
  queryFormatAnalysisReport,
  queryPredictPrice,
  queryScoreOverallSignal
} from '../../../shared/stock-analysis'
