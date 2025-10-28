import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';

// Helper to format camelCase keys into readable labels
const formatLabel = (key) => {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1) + ' (ft)';
};

export default function App() {
  const [inputs, setInputs] = useState({
    plotWidth: 30,
    plotLength: 60,
    roadWidth: 30,
    parkingWidth: 18,
    parkingLength: 18,
    staircaseWidth: 6,
    staircaseLength: 6,
    setbackFront: 10,
    setbackBack: 5,
    setbackLeft: 5,
    setbackRight: 5,
    floors: 5,
    addParking: true,
    addStaircase: false,
  });

  const diagramRef = useRef(null);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setInputs({
      ...inputs,
      [name]: type === 'checkbox' ? checked : Math.max(0, parseFloat(value) || 0),
    });
  };

  const calculations = useMemo(() => {
    const { plotWidth, plotLength, setbackLeft, setbackRight, setbackFront, setbackBack, floors } = inputs;
    const plotArea = plotWidth * plotLength;
    const buildableWidth = Math.max(0, plotWidth - setbackLeft - setbackRight);
    const buildableLength = Math.max(0, plotLength - setbackFront - setbackBack);
    const groundFloorArea = buildableWidth * buildableLength;
    const totalBUA = groundFloorArea * floors;
    const groundCoverage = plotArea > 0 ? (groundFloorArea / plotArea) * 100 : 0;
    const far = plotArea > 0 ? totalBUA / plotArea : 0;

    return { plotArea, totalBUA, groundCoverage, far, buildableWidth, buildableLength };
  }, [inputs]);

  const handleExport = async () => {
    if (!diagramRef.current) return;
    const canvas = await html2canvas(diagramRef.current, { backgroundColor: null, logging: false });
    const link = document.createElement('a');
    link.download = 'plot-diagram.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col lg:flex-row gap-6 font-sans">
      <div className="lg:w-1/3 border rounded-md p-4 shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Property Dimensions</h2>
        {Object.keys(inputs).map((key) => {
          if (typeof inputs[key] === 'boolean') {
            return (
              <div key={key} className="flex justify-between items-center text-sm mb-2">
                <label className="text-gray-600">{formatLabel(key)}</label>
                <input type="checkbox" name={key} checked={inputs[key]} onChange={handleChange} />
              </div>
            );
          }
          return (
            <div key={key} className="flex justify-between items-center text-sm mb-2">
              <label className="text-gray-600">{formatLabel(key)}</label>
              <input
                type="number"
                name={key}
                value={inputs[key]}
                onChange={handleChange}
                min="0"
                className="border p-1.5 w-28 text-right rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          );
        })}
        <div className="border-t pt-4 mt-4 space-y-2">
          <h3 className="text-lg font-semibold mb-2">Calculated Metrics</h3>
          <div className="flex justify-between text-sm"><span>Plot Area:</span> <strong>{calculations.plotArea.toFixed(2)} sq.ft</strong></div>
          <div className="flex justify-between text-sm"><span>Ground Coverage:</span> <strong>{calculations.groundCoverage.toFixed(2)} %</strong></div>
          <div className="flex justify-between text-sm"><span>Total Built-Up Area (BUA):</span> <strong>{calculations.totalBUA.toFixed(2)} sq.ft</strong></div>
          <div className="flex justify-between text-sm"><span>Floor Area Ratio (FAR):</span> <strong>{calculations.far.toFixed(2)}</strong></div>
        </div>
        <button onClick={handleExport} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
          Export as PNG
        </button>
      </div>

      <div className="flex-1 flex justify-center items-center p-4 border rounded-md shadow-sm bg-white">
        <div ref={diagramRef} className="p-4 bg-white">
          <PlotDiagramSVG inputs={inputs} buildable={calculations} />
        </div>
      </div>
    </div>
  );
}

// ------------------- SVG Component -------------------
const PlotDiagramSVG = ({ inputs, buildable }) => {
  const { plotWidth, plotLength, roadWidth, setbackFront, setbackBack, setbackLeft, setbackRight, parkingWidth, parkingLength, staircaseWidth, staircaseLength, addParking, addStaircase } = inputs;
  const PADDING = 20;
  const MAX_SIZE = 500;

  const totalWidthFt = plotWidth;
  const totalHeightFt = plotLength + roadWidth;
  if (totalWidthFt <= 0 || totalHeightFt <= 0) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100">Enter valid dimensions</div>;
  }

  const scale = Math.min(MAX_SIZE / totalWidthFt, MAX_SIZE / totalHeightFt);
  const svgWidth = totalWidthFt * scale + PADDING * 2;
  const svgHeight = totalHeightFt * scale + PADDING * 2;

  const pW = plotWidth * scale;
  const pL = plotLength * scale;
  const rW = roadWidth * scale;
  const sF = setbackFront * scale;
  const sB = setbackBack * scale;
  const sL = setbackLeft * scale;
  const sR = setbackRight * scale;
  const bW = buildable.buildableWidth * scale;
  const bL = buildable.buildableLength * scale;
  const parkW = parkingWidth * scale;
  const parkL = parkingLength * scale;
  const parkX = sL + (bW - parkW) / 2;
  const parkY = sB + bL - parkL;
  const stairW = staircaseWidth * scale;
  const stairL = staircaseLength * scale;
  const stairX = sL + 5;
  const stairY = sB + 5;

  return (
    <svg width={svgWidth} height={svgHeight} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`.dim-text { font-size: 10px; fill: #333; } .label-text { font-size: 12px; font-weight: bold; fill: #fff; }`}</style>
      </defs>
      <g transform={`translate(${PADDING}, ${PADDING})`}>
        <text x={pW - 10} y="-5" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold' }}>N</text>
        <path d={`M ${pW - 10} 0 L ${pW - 10} 15 M ${pW - 10} 0 L ${pW - 13} 5 M ${pW - 10} 0 L ${pW - 7} 5`} stroke="black" strokeWidth="1.5" fill="none" />

        <rect x="0" y="0" width={pW} height={pL} fill="#a7f3d0" stroke="#15803d" strokeWidth="1" />
        <rect x="0" y={pL} width={pW} height={rW} fill="#e5e7eb" stroke="#6b7280" strokeWidth="1" />
        <text x={pW/2} y={pL + rW/2} textAnchor="middle" alignmentBaseline="middle" className="label-text" fill="#374151">Road ({inputs.roadWidth} ft)</text>

        <rect x={sL} y={sB} width={bW} height={bL} fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" />
        <text x={sL + bW/2} y={sB + bL/2} textAnchor="middle" alignmentBaseline="middle" className="label-text" fill="#1e3a8a">Buildable Area</text>

        {addParking && parkingWidth > 0 && parkingLength > 0 && (
          <rect x={parkX} y={parkY} width={parkW} height={parkL} fill="#fef08a" stroke="#ca8a04" strokeDasharray="4" />
        )}

        {addStaircase && stairW > 0 && stairL > 0 && (
          <rect x={stairX} y={stairY} width={stairW} height={stairL} fill="#f87171" stroke="#b91c1c" strokeDasharray="2" />
        )}

        {/* Dimensions */}
        <path d={`M 0 ${pL + 15} L ${pW} ${pL + 15}`} stroke="black" strokeWidth="0.5" />
        <text x={pW/2} y={pL + 25} textAnchor="middle" className="dim-text">{plotWidth} ft</text>
        <path d={`M ${pW + 15} 0 L ${pW + 15} ${pL}`} stroke="black" strokeWidth="0.5" />
        <text x={pW + 25} y={pL/2} textAnchor="middle" className="dim-text" transform={`rotate(-90, ${pW + 25}, ${pL/2})`}>{plotLength} ft</text>
      </g>
    </svg>
  );
};
