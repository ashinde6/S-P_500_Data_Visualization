"use client";
import * as d3 from "d3";
import styles from "../page.module.css";
import { useEffect, useRef } from "react";
import { annotation, annotationLabel } from "d3-svg-annotation";
import { getBasePath } from "../../next.config";

type Price = {
    date: Date;
    price: number;
    tooltipInfo: string;
};

export default function HistoricalData() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const axisBottom = useRef<SVGGElement | null>(null);
    const axisLeft = useRef<SVGGElement | null>(null);

    const width = 800;
    const height = 500;
    const margin = { top: 30, right: 50, bottom: 70, left: 70 };

    const basePath = getBasePath();

    useEffect(() => {
        d3.csv(`${basePath}/data/index_data.csv`, function (d) {
            return {
                date: new Date(d.Date),
                price: +d.SP500,
                tooltipInfo: `${new Date(d.Date).toDateString()}<br><b>${Number(d.SP500).toFixed(2)}</b>`
            };
        }).then(function (d) {
            const data = d.filter((entry) => entry.date.getFullYear() >= 1980)
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            const x = d3
                .scaleTime()
                .domain(d3.extent(data, (d) => d.date) as [Date, Date])
                .range([0, width]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => d.price) as number + 500])
                .range([height, 0]);

            if (axisBottom.current) {
                d3.select(axisBottom.current)
                    .call(d3.axisBottom(x).ticks(d3.timeYear.every(2)));
            }
            if (axisLeft.current) {
                d3.select(axisLeft.current).call(d3.axisLeft(y));

                d3.select(svgRef.current)
                    .append("g")
                    .attr("class", "grid")
                    .attr("transform", `translate(${margin.left},${margin.top})`)
                    .call(
                        d3.axisLeft(y)
                            .tickSize(-width)
                            .tickFormat(() => "")
                    )
                    .selectAll("line")
                    .attr("stroke", "#4e4e4e")
                    .attr("stroke-dasharray", "1 1");
            }

            const svg = d3.select(svgRef.current);

            const line = d3.line<Price>()
                .x((d) => x(d.date))
                .y((d) => y(d.price))
                .curve(d3.curveMonotoneX);

            const path = d3.select("#line");

            path.datum(data)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "#2ec4b6")
                .attr("stroke-width", 2.5);

            // Tooltip resource used: https://medium.com/better-programming/react-d3-plotting-a-line-chart-with-tooltips-ed41a4c31f4f
            const focus = svg
                .append("g")
                .attr("class", "focus")
                .style("display", "none")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            focus
                .append("circle")
                .attr("r", 8)
                .attr("class", "circle")
                .attr("fill", "#2ec4b6");

            let tooltip = d3.select<HTMLDivElement, unknown>("#container").select<HTMLDivElement>(".tooltip");

            if (tooltip.empty()) {
                tooltip = d3
                    .select("#container")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background", "white")
                    .style("border", "2px solid #000")
                    .style("padding", "5px")
                    .style("border-radius", "3px")
                    .style("pointer-events", "none")
                    .style("opacity", 0);
            }

            svg
                .append("rect")
                .attr("class", "overlay")
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .attr("width", width)
                .attr("height", height)
                .style("opacity", 0)
                .on("mouseover", () => {
                    focus.style("display", null);
                    tooltip.style("opacity", 1);
                })
                .on("mouseout", () => {
                    focus.style("display", "none");
                    tooltip.transition().duration(300).style("opacity", 0);
                })
                .on("mousemove", (event) => {
                    const bisect = d3.bisector((d: Price) => d.date).left;
                    const mousePointer = d3.pointer(event);
                    const hoverDate = x.invert(mousePointer[0]);

                    let i = bisect(data, hoverDate);
                    if (i >= data.length) {
                        i = data.length - 1;
                    }
                    if (i <= 0) {
                        i = 0;
                    }

                    const closestDate = data[i];

                    focus.attr("transform", `translate(${x(closestDate.date) + margin.left},${y(closestDate.price) + margin.top})`);

                    const tooltipX = x(closestDate.date) + margin.left + 50;
                    const tooltipY = y(closestDate.price) + margin.top - 50;

                    tooltip
                        .html(closestDate.tooltipInfo || closestDate.date.toDateString())
                        .style("left", `${tooltipX}px`)
                        .style("top", `${tooltipY}px`)
                        .style("color", "#000");

                });

            const annotations = [];

            const covidAnnotationDate = new Date(2020, 1, 29);
            const covidAnnotationPoint = data.find(d => {
                return (
                    d.date.getFullYear() === covidAnnotationDate.getFullYear() &&
                    d.date.getMonth() === covidAnnotationDate.getMonth() &&
                    d.date.getDate() === covidAnnotationDate.getDate()
                )
            });

            const financialCrisisAnnotationDate = new Date(2009, 0, 31)
            const financialCrisisAnnotationPoint = data.find(d => {
                return (
                    d.date.getFullYear() === financialCrisisAnnotationDate.getFullYear() &&
                    d.date.getMonth() === financialCrisisAnnotationDate.getMonth() &&
                    d.date.getDate() === financialCrisisAnnotationDate.getDate()
                )
            });

            const dotcomPeakAnnotationDate = new Date(2000, 6, 31);
            const dotcomPeakAnnotationPoint = data.find(d => {
                return (
                    d.date.getFullYear() === dotcomPeakAnnotationDate.getFullYear() &&
                    d.date.getMonth() === dotcomPeakAnnotationDate.getMonth() &&
                    d.date.getDate() === dotcomPeakAnnotationDate.getDate()
                )
            });

            const dotcomBurstAnnotationDate = new Date(2003, 0, 31);
            const dotcomBurstAnnotationPoint = data.find(d => {
                return (
                    d.date.getFullYear() === dotcomBurstAnnotationDate.getFullYear() &&
                    d.date.getMonth() === dotcomBurstAnnotationDate.getMonth() &&
                    d.date.getDate() === dotcomBurstAnnotationDate.getDate()
                )
            });

            const housingPeakDate = new Date(2007, 5, 30);
            const housingPeakPoint = data.find(d => {
                return (
                    d.date.getFullYear() === housingPeakDate.getFullYear() &&
                    d.date.getMonth() === housingPeakDate.getMonth() &&
                    d.date.getDate() === housingPeakDate.getDate()
                )
            });

            const inflationDate = new Date(2022, 0, 31);
            const inflationPoint = data.find(d => {
                return (
                    d.date.getFullYear() === inflationDate.getFullYear() &&
                    d.date.getMonth() === inflationDate.getMonth() &&
                    d.date.getDate() === inflationDate.getDate()
                )
            });

            if (covidAnnotationPoint) {
                annotations.push({
                    note: {
                        label: "",
                        title: "COVID-19 Pandemic"
                    },
                    x: x(covidAnnotationPoint.date) + margin.left,
                    y: y(covidAnnotationPoint.price) + margin.top,
                    dx: 0,
                    dy: 100
                });
            }

            if (financialCrisisAnnotationPoint) {
                annotations.push({
                    note: {
                        label: "",
                        title: "Global Financial Crisis"
                    },
                    x: x(financialCrisisAnnotationPoint.date) + margin.left,
                    y: y(financialCrisisAnnotationPoint.price) + margin.top,
                    dx: 60,
                    dy: 15
                });
            }

            if (dotcomPeakAnnotationPoint) {
                annotations.push({
                    note: {
                        label: "",
                        title: "Dotcom Bubble Peak"
                    },
                    x: x(dotcomPeakAnnotationPoint.date) + margin.left,
                    y: y(dotcomPeakAnnotationPoint.price) + margin.top,
                    dx: 0,
                    dy: -120
                });
            }

            if (dotcomBurstAnnotationPoint) {
                annotations.push({
                    note: {
                        label: "",
                        title: "Dotcom Bubble Burst"
                    },
                    x: x(dotcomBurstAnnotationPoint.date) + margin.left,
                    y: y(dotcomBurstAnnotationPoint.price) + margin.top,
                    dx: -40,
                    dy: 35
                });
            }

            if (housingPeakPoint) {
                annotations.push({
                    note: {
                        label: "",
                        title: "Housing Market Boom"
                    },
                    x: x(housingPeakPoint.date) + margin.left,
                    y: y(housingPeakPoint.price) + margin.top,
                    dx: 0,
                    dy: -110
                });
            }

            if (inflationPoint) {
                annotations.push({
                    note: {
                        label: "",
                        title: "Inflation, Ukraine Russia War"
                    },
                    x: x(inflationPoint.date) + margin.left,
                    y: y(inflationPoint.price) + margin.top,
                    dx: 20,
                    dy: 180
                });
            }

            const makeAnnotations = annotation()
                .type(annotationLabel)
                .annotations(annotations);

            svg.append("g")
                .call(makeAnnotations as unknown as (g: d3.Selection<SVGGElement, unknown, null, undefined>) => void);

            svg.append("text")
                .attr("class", "x-axis-title")
                .attr("text-anchor", "middle")
                .attr("x", margin.left + width / 2)
                .attr("y", height + 80)
                .style("fill", "#fff")
                .text("Year");

            svg.append("text")
                .attr("class", "y-axis-title")
                .attr("text-anchor", "middle")
                .attr("transform", `rotate(-90)`)
                .attr("x", -(margin.top + height / 2))
                .attr("y", 20)
                .style("fill", "#fff")
                .text("Index Value");
        });
    }, []);



    return (
        <div id="container" style={{ position: "relative", height: height + margin.top + margin.bottom, display: 'flex' }}>
            <div className={styles.chartContainer}>
                <h2>S&P 500 Index Historical Chart</h2>
                <svg
                    ref={svgRef}
                    width={width + margin.left + margin.right}
                    height={height + margin.top + margin.bottom}
                >
                    <g
                        ref={axisBottom}
                        transform={`translate(${margin.left}, ${height + margin.top})`}
                        style={{ stroke: '#ccc' }}
                    >
                    </g>
                    <g
                        ref={axisLeft}
                        transform={`translate(${margin.left}, ${margin.top})`}
                        style={{ stroke: '#ccc' }}
                    >
                    </g>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        <path id="line" />
                    </g>
                </svg>
            </div>
            <div>
                <p style={{ paddingRight: '0.8rem' }}>
                    The chart on the left shows the historical performance of the S&P 500 Index from 1980 to 2023. 
                    The index only uses free-floating shares, or the shares that are available to the public, to 
                    calculate the market cap. The index is calculated by summing the market caps of each company
                    and dividing by a divisor, a value that is not publicly released.
                    <br></br><br></br>
                    The chart illustrates the upward trend in how the S&P 500 generally increased over time.
                    As shown, the index was at around 115 in 1980, growing up to around 4500 in 2023. The historical
                    index growth were due to a number of reasons including economic growth creating company profits,
                    inflation causing the rise of prices, and companies reinvesting profit earnings towards growth opportunities.
                    <br></br><br></br>
                    As mentioned before, the S&P 500 has been used as a key benchmark for the U.S. economy.
                    The chart displays how the index responded with significant economical events in history. 
                    For example, the Covid-19 Pandemic significantly declined the economy, with this impact
                    being also visible in the S&P 500 Index in the year 2020 when it dropped significantly.  
                </p>
            </div>
        </div>
    )
}