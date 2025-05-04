using Microsoft.AspNetCore.Mvc;

namespace ChartRendererApp.Controllers
{
    public class ChartsController : Controller
    {
        [HttpGet]
        public IActionResult LoadChart(string id)
        {
            var viewName = id switch
            {
                // Line Charts
                "line-basic" => "_LineBasic",
                "line-labels" => "_LineLabels",

                // Area Charts
                "area-basic" => "_AreaBasic",
                "area-stacked" => "_AreaStacked",
                "area-inverted" => "_AreaInverted",

                // Column and Bar Charts
                "column-basic" => "_ColumnBasic",
                "column-stacked" => "_ColumnStacked",
                "column-range" => "_ColumnRange",
                "column-stacked-grouped" => "_ColumnStackedGrouped",
                "column-stacked-percentage" => "_ColumnStackedPercentage",
                "bar-basic" => "_BarBasic",
                "bar-stacked" => "_BarStacked",

                // Pie Charts
                "pie-basic" => "_PieBasic",
                "pie-donut" => "_PieDonut",
                "pie-semi-donut" => "_PieSemiDonut",

                // Scatter and Bubble Charts
                "scatter-basic" => "_ScatterBasic",
                "scatter-jitter" => "_ScatterJitter",
                "bubble-basic" => "_BubbleBasic",
                "bubble-packed" => "_BubblePacked",
                "bubble-split-packed" => "_BubbleSplitPacked",

                // Default fallback
                _ => "_ChartNotFound"
            };

            return PartialView($"~/Views/Charts/{viewName}.cshtml");
        }
    }
}
