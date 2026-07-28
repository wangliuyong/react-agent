import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-C3K48oRM.js";
import { aP as DB_THEME } from "./index-D2SMd1bE.js";
import { i as init, L as LinearGradient, u as use, b as install, c as install$1, k as install$2, d as install$3, e as install$4, g as install$5, l as install$6, j as install$7 } from "./vendor-echarts-CR9Xz9lf.js";
const grid = "_grid_1a0mc_1";
const chartCard = "_chartCard_1a0mc_7";
const chartHeader = "_chartHeader_1a0mc_23";
const chartTitle = "_chartTitle_1a0mc_27";
const chartSubtitle = "_chartSubtitle_1a0mc_35";
const chartCanvas = "_chartCanvas_1a0mc_41";
const styles = {
  grid,
  chartCard,
  chartHeader,
  chartTitle,
  chartSubtitle,
  chartCanvas
};
use([
  install,
  install$1,
  install$2,
  install$3,
  install$4,
  install$5,
  install$6,
  install$7
]);
function ChartHost({ title, subtitle, onMount, className }) {
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const el = ref.current;
    if (!el) return void 0;
    return onMount(el);
  }, [onMount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: [styles.chartCard, className].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: styles.chartHeader, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles.chartTitle, children: title }),
      subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.chartSubtitle, children: subtitle }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: styles.chartCanvas, role: "img", "aria-label": title })
  ] });
}
const axisStyle = {
  axisLine: { lineStyle: { color: DB_THEME.border } },
  axisLabel: { color: DB_THEME.textSecondary, fontSize: 11 },
  splitLine: { lineStyle: { color: DB_THEME.borderLight, type: "dashed" } }
};
function WorkbenchCharts({
  dayLabels,
  activitySeries,
  typeBreakdown,
  topSessions
}) {
  const activityMount = reactExports.useCallback(
    (el) => {
      const chart = init(el);
      chart.setOption({
        color: [DB_THEME.primary],
        grid: { left: 40, right: 16, top: 24, bottom: 28 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: dayLabels, ...axisStyle },
        yAxis: { type: "value", minInterval: 1, ...axisStyle },
        series: [
          {
            name: "活跃会话",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            areaStyle: {
              color: new LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(0, 87, 255, 0.28)" },
                { offset: 1, color: "rgba(0, 87, 255, 0.02)" }
              ])
            },
            data: activitySeries
          }
        ]
      });
      const onResize = () => chart.resize();
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        chart.dispose();
      };
    },
    [activitySeries, dayLabels]
  );
  const typeMount = reactExports.useCallback(
    (el) => {
      const chart = init(el);
      chart.setOption({
        color: [DB_THEME.primary, DB_THEME.primaryLight, DB_THEME.success, DB_THEME.warning],
        tooltip: { trigger: "item", formatter: "{b}：{c}（{d}%）" },
        legend: {
          bottom: 0,
          textStyle: { color: DB_THEME.textSecondary, fontSize: 11 }
        },
        series: [
          {
            type: "pie",
            radius: ["42%", "68%"],
            center: ["50%", "44%"],
            itemStyle: { borderRadius: 6, borderColor: DB_THEME.bgContent, borderWidth: 2 },
            label: { show: false },
            data: typeBreakdown.length ? typeBreakdown : [{ name: "暂无数据", value: 1 }]
          }
        ]
      });
      const onResize = () => chart.resize();
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        chart.dispose();
      };
    },
    [typeBreakdown]
  );
  reactExports.useCallback(
    (el) => {
      const chart = init(el);
      chart.setOption({
        color: [DB_THEME.primary],
        grid: { left: 12, right: 16, top: 16, bottom: 48, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        xAxis: {
          type: "value",
          ...axisStyle
        },
        yAxis: {
          type: "category",
          data: topSessions.map((s) => s.title),
          axisLabel: { color: DB_THEME.textSecondary, fontSize: 11, width: 88, overflow: "truncate" },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        series: [
          {
            name: "Token",
            type: "bar",
            barMaxWidth: 18,
            itemStyle: { borderRadius: [0, 6, 6, 0] },
            data: topSessions.map((s) => s.tokens)
          }
        ]
      });
      const onResize = () => chart.resize();
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        chart.dispose();
      };
    },
    [topSessions]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.grid, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ChartHost,
      {
        title: "近 7 日活跃",
        subtitle: "按会话最后更新时间统计",
        onMount: activityMount
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartHost, { title: "会话类型", subtitle: "对话 / 发布 / 定时 / 流程", onMount: typeMount })
  ] });
}
export {
  WorkbenchCharts
};
