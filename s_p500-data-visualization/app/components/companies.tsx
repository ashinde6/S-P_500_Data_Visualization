"use client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { getBasePath } from "../../next.config";

type Company = {
    company: string;
    symbol: string;
    weight: number;
    price: string;
    ytdReturn: string;
};

export default function Companies() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef(null);

    const width = 800;
    const height = 550;

    const basePath = getBasePath();

    useEffect(() => {
        Promise.all([
            d3.csv(`${basePath}/data/sp.csv`),
            d3.csv(`${basePath}/data/sp_performance.csv`)
        ]).then(([companies, performance]) => {
            const companyReturns = new Map<string, string>();
            performance.forEach((d) => {
                if (d.Symbol && d["YTD Return"]) {
                    companyReturns.set(d.Symbol, d["YTD Return"]);
                }
            });

            const companyData: Company[] = companies.map((d, i) => ({
                company: d.Company ?? "",
                symbol: d.Symbol ?? "",
                weight: d.Weight ? parseFloat(d.Weight.replace('%', '')) / 100 : 0,
                price: d.Price ?? "",
                ytdReturn: companyReturns.get(d.Symbol ?? "") ?? "",
            }));

            const minYtdReturn = Math.min(...companyData.map(data => Number(data.ytdReturn)));
            const maxYtdReturn = Math.max(...companyData.map(data => Number(data.ytdReturn)));

            const colorScale = d3.scaleLinear<string>()
                .domain([minYtdReturn, 0, maxYtdReturn])
                .range(["red", "white", "green"]);

            // establish the root of the treemap
            const root = d3
                .hierarchy({ children: companyData } as any)
                .sum((d) => (d as Company).weight)
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

            d3.treemap<Company>()
                .size([width, height])
                .padding(2)
                (root);

            const svg = d3.select(svgRef.current);

            // create tooltip with appropriate styling
            const tooltip = d3.select(containerRef.current)
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("border-color", "#000")
                .style("padding", "5px")
                .style("pointer-events", "none")
                .style("z-index", "10");

            // define hover over events
            const nodes = svg
                .selectAll("g")
                .data(root.leaves() as d3.HierarchyRectangularNode<Company>[])
                .enter()
                .append("g")
                .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
                .style("cursor", "pointer")
                .on("mouseover", (event, d) => {
                    tooltip
                        .style("opacity", 1)
                        .html(
                            `Symbol: <b>${d.data.symbol}</b>
                      <br/>Company: <b>${d.data.company}</b>
                      <br/>Weight: <b>${(d.data.weight * 100).toFixed(2)}%</b>
                      <br/>Year To Date Price Return: <div style="color:${Number(d.data.ytdReturn) < 0 ? 'red' : 'green'};"><b>${d.data.ytdReturn}</b></div>`
                        )
                        .style("left", `${event.pageX - 900}px`)
                        .style("top", `${event.pageY - 110}px`)
                        .style("color", "#000");
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", `${event.pageX - 290}px`).style("top", `${event.pageY - 110}px`);
                })
                .on("mouseleave", () => {
                    tooltip.style("opacity", 0);
                });

            // create the rectangles within the treemap
            nodes
                .append("rect")
                .attr("width", (d) => d.x1 - d.x0)
                .attr("height", (d) => d.y1 - d.y0)
                .attr("fill", (d) => {
                    return colorScale(Number(d.data.ytdReturn));
                })
                .attr("stroke", "black");

            nodes
                .append("text")
                .text((d) => (d.x1 - d.x0 < 30 ? "." : d.data.symbol))
                .attr("text-align", "center")
                .attr("x", 4)
                .attr("y", 14)
                .attr("font-size", "13px")
                .attr("fill", "black")
                .style("pointer-events", "none");

            // create the treemap legend
            const legendSvg = d3.select("#color-legend");

            const defs = legendSvg.append("defs");

            const linearGradient = defs.append("linearGradient")
                .attr("id", "legend-gradient");

            linearGradient.selectAll("stop")
                .data([
                    { offset: "0%", color: "red" },
                    { offset: "50%", color: "white" },
                    { offset: "100%", color: "green" }
                ])
                .enter()
                .append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);

            legendSvg.append("rect")
                .attr("x", 20)
                .attr("y", 20)
                .attr("width", 260)
                .attr("height", 10)
                .style("fill", "url(#legend-gradient)")
                .style("stroke", "black");

            const legendScale = d3.scaleLinear()
                .domain([minYtdReturn, maxYtdReturn])
                .range([20, 260]);

            const axis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d => `${d}%`);

            legendSvg.append("g")
                .attr("transform", `translate(0, 30)`)
                .call(axis);

        })
    }, []);

    return (
        <div id="container" ref={containerRef} style={{ position: "relative", padding: '0.5rem', display: 'flex' }}>
            <div style={{ width: '50%' }}>
                <p style={{ padding: '0.5rem' }}>
                    The S&P 500 Index is composed of the top 500 public companies in the US, each mapped with their weighting.
                    The index uses a market cap weighting formula that gives companies with larger market capitalization
                    a higher percentage allocation. This formula divides the company market cap by the total of all market caps.
                    The market cap of a company is calculated by multiplying the current stock price by the company's outstanding
                    shares.
                    <br></br><br></br>
                    The treemap to the right illustrates the distribution of the companies in the S&P 500 Index with the size of
                    each block corresponding to the company's market cap weighting and the color corresponding to the Year to Date Price Return 
                    as of August 2nd, 2025. The top 3 holdings of the index at this point in time were Nvidia, Microsoft, and Apple. A company's weighting 
                    provides crucial information on the impact of overall index. Those with higher weighting create a larger impact 
                    on the overall index compared to the companies with smaller weightings. A limitation of the S&P 500 Index being
                     market-cap-weighted is when certain company stocks become overvalued. This causes the index to ultimately 
                     inflate if the stocks have higher weight.
                    <br></br><br></br>
                    Hovering over a specific block in the treemap will open a tooltip with the
                    specific market cap weighting of that company in the index and the year to date price return
                    amount.
                </p>
            </div>
            <div style={{ justifyItems: 'center', marginRight: '0.75rem' }}>
                <h2 style={{ marginBottom: '0.5rem' }}>S&P 500 Index Companies by Market Cap Weight</h2>
                <svg
                    ref={svgRef}
                    width={width}
                    height={height}
                >

                </svg>
                <div style={{ display: 'flex' }}>
                    <div>Year to Date Price Return: </div>
                    <svg id="color-legend" width={300} height={50}></svg>
                </div>
            </div>
        </div>
    );
}