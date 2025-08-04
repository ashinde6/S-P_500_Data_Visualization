"use client";
import styles from "../page.module.css";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { annotation, annotationLabel } from "d3-svg-annotation";
import { getBasePath } from "../../next.config";

type PerformanceItem = {
    year: number;
    performance: number;
}

type InvestmentEntry = {
    year: Date;
    value: number;
}

export default function Performance() {
    const containerRef = useRef(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const axisBottom = useRef<SVGGElement | null>(null);
    const axisLeft = useRef<SVGGElement | null>(null);

    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const [data, setData] = useState<InvestmentEntry[]>([]);

    const [moneyInvested, setMoneyInvested] = useState(10);

    const basePath = getBasePath();

    useEffect(() => {
        d3.csv(`${basePath}/data/history.csv`, function (d) {
            return {
                year: +d.Year,
                performance: +d.Performance
            };
        }).then(function (d) {
            const performanceData = d
                .filter((entry) => entry.year >= 2009)
                .sort((a, b) => a.year - b.year);

            const investmentGrowth: InvestmentEntry[] = calculateInvestmentGrowth(performanceData, moneyInvested);
            setData(investmentGrowth);

            const investmentAmount = investmentGrowth[investmentGrowth.length - 1].value;

            const x = d3
                .scaleTime()
                .domain(d3.extent(investmentGrowth, d => d.year) as [Date, Date])
                .range([0, innerWidth]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(investmentGrowth, (d) => d.value) as number * 1.5 + 5])
                .range([innerHeight, 0]);

            const svg = d3.select(svgRef.current);

            // reset svg
            svg.selectAll(".investment-line").remove();
            svg.selectAll(".investment-dots").remove();
            svg.selectAll(".annotation").remove();
            svg.selectAll(".grid").remove();

            // create axes
            if (axisBottom.current) {
                d3.select(axisBottom.current)
                    .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)));
            }
            if (axisLeft.current) {
                d3.select(axisLeft.current).call(d3.axisLeft(y));

                d3.select(svgRef.current)
                    .append("g")
                    .attr("class", "grid")
                    .attr("transform", `translate(${margin.left},${margin.top})`)
                    .call(
                        d3.axisLeft(y)
                            .tickSize(-innerWidth)
                            .tickFormat(() => "")
                    )
                    .selectAll("line")
                    .attr("stroke", "#4e4e4e")
                    .attr("stroke-dasharray", "1 1");
            }

            // create line of the chart
            const line = d3.line<InvestmentEntry>()
                .x((d) => x(d.year))
                .y((d) => y(d.value));

            svg.append("path")
                .datum(investmentGrowth)
                .attr("class", "investment-line")
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "#2ec4b6")
                .attr("stroke-width", 2.5);

            svg.append("g")
                .attr("class", "investment-dots")
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .style("cursor", "pointer")
                .selectAll("circle")
                .data(investmentGrowth)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.value))
                .attr("r", 5)
                .attr("fill", "#2ec4b6");

            // create chart tooltip
            let tooltip = d3.select(containerRef.current).select<HTMLDivElement>(".tooltip");

            if (tooltip.empty()) {
                tooltip = d3
                    .select(containerRef.current)
                    .append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background", "white")
                    .style("border", "2px solid #000")
                    .style("padding", "5px")
                    .style("border-radius", "3px")
                    .style("pointer-events", "none")
                    .style("opacity", 0)
                    .style("font-size", "14px");
            }

            // establish hover over behavior
            svg.append("g")
                .attr("class", "investment-dots")
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .selectAll("circle")
                .data(investmentGrowth)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.value))
                .attr("r", 5)
                .attr("fill", "#2ec4b6")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1);
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                })
                .on("mousemove", (event, d) => {
                    tooltip
                        .html(`Investment Value in ${d.year.getFullYear()}: <br> <b>$${d.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 40}px`)
                        .style("color", "#000");
                });

            // create graph annotations
            const annotations = [
                {
                    note: {
                        label: "$" + moneyInvested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        title: "Initial Investment:"
                    },
                    x: x(investmentGrowth[0].year) + margin.left,
                    y: y(investmentGrowth[0].value) + margin.top,
                    dx: 80,
                    dy: -100
                },
                {
                    note: {
                        label: "$" + investmentAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        title: "Investment Value in 2024:"
                    },
                    x: x(investmentGrowth[investmentGrowth.length - 1].year) + margin.left,
                    y: y(investmentGrowth[investmentGrowth.length - 1].value) + margin.top,
                    dx: -80,
                    dy: -30
                }
            ];

            const makeAnnotations = annotation()
                .type(annotationLabel)
                .annotations(annotations);

            svg.append("g")
                .call(makeAnnotations as unknown as (g: d3.Selection<SVGGElement, unknown, null, undefined>) => void);

            // create axis titles
            svg.append("text")
                .attr("class", "x-axis-title")
                .attr("text-anchor", "middle")
                .attr("x", margin.left + innerWidth / 2)
                .attr("y", height)
                .style("fill", "#fff")
                .text("Year");

            svg.append("text")
                .attr("class", "y-axis-title")
                .attr("text-anchor", "middle")
                .attr("transform", `rotate(-90)`)
                .attr("x", -(margin.top + innerHeight / 2))
                .attr("y", 20)
                .style("fill", "#fff")
                .text("Investment Value ($)");
        });
    }, [moneyInvested]);

    function calculateInvestmentGrowth(performanceData: PerformanceItem[], moneyInvested: number): InvestmentEntry[] {
        const result: InvestmentEntry[] = [];
        let value = moneyInvested;

        for (const entry of performanceData.sort((a: PerformanceItem, b: PerformanceItem) => Number(a.year) - Number(b.year))) {
            result.push({ year: new Date(entry.year, 0), value: +value.toFixed(2) });
            value *= 1 + Number(entry.performance) / 100;
        }

        return result;
    }

    function onChange(newInput: number) {
        if (newInput >= 0) {
            setMoneyInvested(newInput);
        }
    }

    return (
        <div id="container" ref={containerRef} className={styles.performanceContainer}>
            <div className={styles.chartContainer}>
                <h2>S&P 500 Historical Returns</h2>
                <svg ref={svgRef} width={width} height={height}>
                    <g
                        ref={axisBottom}
                        transform={`translate(${margin.left}, ${height - margin.bottom})`}
                    />
                    <g
                        ref={axisLeft}
                        transform={`translate(${margin.left}, ${margin.top})`}
                    />
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        <path id="line" />
                    </g>
                </svg>
                <div className={styles.calculationBox}>
                    <label>Amount Invested in 2009: $
                        <input id="investAmount" value={moneyInvested} type="number" min="0" onChange={(event) => onChange(Number(event.target.value))}></input>
                    </label>
                    <div>Investment Value in 2024: ${data[data.length - 1]?.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} </div>
                </div>
            </div>
            <div>
                <p style={{ padding: '0.5rem', paddingRight: '1.75rem' }}>
                    The S&P 500 Index cannot be directly invested in as it is simply an index. However, there are a number of index
                    funds that direct and track its performance. An example is the Vanguard 500 Index Fund
                    that tracks the price and performance of the S&P 500 Index by investing its total net assets in its
                    companies stocks accounting for each individual weight.
                    <br></br><br></br>
                    This chart illustrates the approximate return on investment from the S&P 500 Index historically from
                    2009 to 2024. An initial investment of $10 in 2009 gradually would increase up to a value of $71.08 in 2024.
                    This growth highlights the long-term potential of passive investing in the index within the broader market.
                    <br></br><br></br>
                    Use the input box below the chart to adjust the initial investment amount in 2009 to observe the change in
                    investment value over the 15 year period in the chart.


                </p>
            </div>
        </div>
    );
}