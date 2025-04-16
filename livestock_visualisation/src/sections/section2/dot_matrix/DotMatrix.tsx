import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './DotMatrix.css';

interface DataItem {
    category: string;
    group: string;
    count: number;
}

interface DotMatrixOptions {
    dot_radius: number;
    no_of_circles_in_a_row: number;
    dot_padding_left: number;
    dot_padding_right: number;
    dot_padding_top: number;
    dot_padding_bottom: number;
}

interface DotMatrixChartProps {
    dataset: DataItem[];
    options: DotMatrixOptions;
}

const DotMatrixChart: React.FC<DotMatrixChartProps> = ({ dataset, options }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Remove previous SVG (if any)
        d3.select(containerRef.current).select('svg').remove();

        // Destructure options
        const dotRadius = options.dot_radius;
        const noOfCirclesInARow = options.no_of_circles_in_a_row;
        const dotPaddingLeft = options.dot_padding_left;
        const dotPaddingRight = options.dot_padding_right;
        const dotPaddingTop = options.dot_padding_top;
        const dotPaddingBottom = options.dot_padding_bottom;

        if (isNaN(dotRadius)) {
            throw new Error("dot_radius must be a Number");
        }
        if (isNaN(noOfCirclesInARow)) {
            throw new Error("no_of_circles_in_a_row must be a Number");
        }
        if (isNaN(dotPaddingLeft)) {
            throw new Error("dot_padding_left must be a Number");
        }
        if (isNaN(dotPaddingRight)) {
            throw new Error("dot_padding_right must be a Number");
        }
        if (isNaN(dotPaddingTop)) {
            throw new Error("dot_padding_top must be a Number");
        }
        if (isNaN(dotPaddingBottom)) {
            throw new Error("dot_padding_bottom must be a Number");
        }

        // build unique categories and groups
        const uniqueCategories: string[] = [];
        const uniqueGroups: string[] = [];
        const flagsCat: { [key: string]: boolean } = {};
        const flagsGroup: { [key: string]: boolean } = {};
        dataset.forEach(d => {
            if (!flagsCat[d.category]) {
                flagsCat[d.category] = true;
                uniqueCategories.push(d.category);
            }
            if (!flagsGroup[d.group]) {
                flagsGroup[d.group] = true;
                uniqueGroups.push(d.group);
            }
        });

        // calculate total count per group
        const sumOfEveryGroup: { [key: string]: number } = {};
        dataset.forEach(d => {
            if (sumOfEveryGroup[d.group] == null) {
                sumOfEveryGroup[d.group] = 0;
            }
            sumOfEveryGroup[d.group] += d.count;
        });

        let maxNoOfLinesInGroup = 0;
        Object.keys(sumOfEveryGroup).forEach(group => {
            const lines = sumOfEveryGroup[group] / noOfCirclesInARow;
            if (lines > maxNoOfLinesInGroup) {
                maxNoOfLinesInGroup = Math.ceil(lines);
            }
        });

        const numberOfLines = maxNoOfLinesInGroup * uniqueGroups.length;
        // Using D3 v4+ scales
        const groupScale = d3.scalePoint<string>()
            .domain(uniqueGroups)
            .range([0, uniqueGroups.length - 1]);

        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueCategories);

        // Set the dimensions of the canvas / graph
        const margin = { top: dotRadius * 10, right: dotRadius * 15, bottom: dotRadius * 10, left: dotRadius * 15 };
        const height = numberOfLines * (dotRadius * 2 + dotPaddingBottom + dotPaddingTop);
        const width = (dotRadius * 2 + dotPaddingLeft + dotPaddingRight) * noOfCirclesInARow;

        // Set the ranges
        const xScale = d3.scaleLinear()
            .range([margin.left, width]);
        const yScale = d3.scaleLinear()
            .range([height, margin.bottom]);

        xScale.domain([0, noOfCirclesInARow]);
        yScale.domain([0, d3.max(dataset, d => groupScale(d.group)! + 1)!]);

        // Create SVG element
        const svg = d3.select(containerRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create Y axis
        const yAxis = d3.axisLeft(yScale)
            .tickFormat((d, i) => uniqueGroups[Number(d)] || "")
            .ticks(uniqueGroups.length)
            .tickSize(-width + margin.left - (dotRadius * 2));
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(${margin.left - (dotRadius * 2)},0)`)
            .call(yAxis)
            .selectAll("text")
            .attr("y", -dotRadius * 5)
            .attr("x", 0)
            .attr("dy", ".35em")
            .style("font-size", `${dotRadius * 3}px`)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "start");

        // Create vertical axis line
        svg.append("line")
            .attr("x1", width)
            .attr("y1", margin.top)
            .attr("x2", width)
            .attr("y2", height)
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Variables to track global positions per group
        const globalLineNoForGroup: { [key: string]: number } = {};
        const globalLineSizeForGroup: { [key: string]: number } = {};
        const globalDotXPosition: { [key: string]: number } = {};

        function generateArray(d: DataItem) {
            if (globalLineSizeForGroup[d.group] == null) {
                globalLineSizeForGroup[d.group] = 0;
            }
            if (globalLineNoForGroup[d.group] == null) {
                globalLineNoForGroup[d.group] = 0.5 / (maxNoOfLinesInGroup);
            }
            if (globalDotXPosition[d.group] == null) {
                globalDotXPosition[d.group] = 0;
            }
            const arr = [];
            for (let i = 0; i < d.count; i++) {
                if (globalLineSizeForGroup[d.group] !== 0 && globalLineSizeForGroup[d.group] % noOfCirclesInARow === 0) {
                    globalLineNoForGroup[d.group] += 1 / (maxNoOfLinesInGroup);
                    globalDotXPosition[d.group] = 1;
                } else {
                    globalDotXPosition[d.group] += 1;
                }
                arr.push({
                    y: (groupScale(d.group)! + globalLineNoForGroup[d.group]),
                    x: globalDotXPosition[d.group] - 1,
                    group: d.group,
                    category: d.category
                });
                globalLineSizeForGroup[d.group]++;
            }
            return arr;
        }

        // Create groups for each data item
        const groups = svg.selectAll("g.group")
            .data(dataset)
            .enter()
            .append("g")
            .attr("class", "group");

        // Create an array for each group's dots and append circles
        const circleArray = groups.selectAll("g.circleArray")
            .data(d => generateArray(d));

        circleArray.enter()
            .append("g")
            .attr("class", "circleArray")
            .append("circle")
            .style("fill", d => color(d.category) as string)
            .attr("r", dotRadius)
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y));

        // Add legend
        const legend = svg.selectAll(".legend")
            .data(uniqueCategories)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${margin.top + dotRadius})`);

        legend.append("circle")
            .attr("cx", width + dotRadius * 4)
            .attr("cy", (d, i) => i * dotRadius * 4)
            .attr("r", dotRadius)
            .style("fill", d => color(d) as string);

        legend.append("text")
            .attr("x", width + dotRadius * 4 + dotRadius * 3)
            .attr("y", (d, i) => i * dotRadius * 4 + dotRadius)
            .attr("text-anchor", "start")
            .style("font-size", `${dotRadius * 3}px`)
            .text(d => d);

        // Create tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");

        tooltip.append("div")
            .attr("class", "group");
        tooltip.append("div")
            .attr("class", "category");

        svg.selectAll(".circleArray > circle")
            .on("mouseover", function(event, d: any) {
                tooltip.select(".group").html(`<b>Group: ${d.group}</b>`);
                tooltip.select(".category").html(`<b>Category: ${d.category}</b>`);
                tooltip.style("display", "block")
                    .style("opacity", 2);
            })
            .on("mousemove", function(event) {
                const [x, y] = d3.pointer(event);
                tooltip.style("top", (y + 10) + "px")
                    .style("left", (x - 25) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none")
                    .style("opacity", 0);
            });

    }, [dataset, options]);

    return <div ref={containerRef} id="DotMatrixChart" />;
};

export default DotMatrixChart;