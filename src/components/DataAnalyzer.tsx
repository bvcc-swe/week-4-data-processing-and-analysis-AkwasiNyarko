import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BarChart3 } from 'lucide-react';

interface AnalysisResult {
  sum?: number;
  average?: number;
  maximum?: number;
  minimum?: number;
  range?: number;
  median?: number;
  count?: number;
  stdDev?: number;
  aboveAverage?: number[]; // values above average
  belowAverage?: number[]; // values below average
  percentiles?: { [key: string]: number }; 
  error?: string;
}

const DataAnalyzer = () => {
  // State management
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  // allow multiple dataset selection
  const [currentDataset, setCurrentDataset] = useState<string[]>(['temperatures']);

  // Sample datasets
  const datasets = {
    temperatures: [72, 75, 68, 80, 77, 74, 69, 78, 76, 73],
    testScores: [88, 92, 79, 95, 87, 90, 84, 89, 93, 86],
    salesFigures: [1200, 1450, 980, 1680, 1250, 1520, 1100, 1400]
  };

  // helper: flatten selected datasets into one array
  const getSelectedData = (selectedKeys: string[]) => {
    const arr: any[] = [];
    selectedKeys.forEach(k => {
      const ds = (datasets as any)[k];
      if (Array.isArray(ds)) arr.push(...ds);
    });
    return arr;
  };
  
  // helper: percentile (linear interpolation)
  const percentile = (sorted: number[], p: number) => {
    if (sorted.length === 0) return NaN;
    const pos = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    if (lower === upper) return sorted[lower];
    const weight = pos - lower;
    return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
  };

  // Main analysis function
  const analyzeData = () => {
    if (!currentDataset || currentDataset.length === 0) {
      setAnalysis({ error: 'No dataset selected' });
      return;
    }

    const data = getSelectedData(currentDataset);
    
    // Filter out non-numeric values
    const validNumbers = data.filter(item => typeof item === 'number' && !isNaN(item));

    // Error handling: no valid numbers found
    if (validNumbers.length === 0) {
      setAnalysis({ error: 'No valid numbers found' });
      return;
    }

    // Calculate sum
    const sum = validNumbers.reduce((total, num) => total + num, 0);

    // Calculate average
    const average = sum / validNumbers.length;

    // Find maximum and minimum
    const maximum = Math.max(...validNumbers);
    const minimum = Math.min(...validNumbers);

    // Calculate range
    const range = maximum - minimum;

    // Calculate median
    const sorted = [...validNumbers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Standard deviation (sample: n-1 if n>1)
    const n = validNumbers.length;
    const variance = n > 1
      ? validNumbers.reduce((acc, v) => acc + Math.pow(v - average, 2), 0) / (n - 1)
      : 0;
    const stdDev = Math.sqrt(variance);

    // Above / below average
    const aboveAverage = validNumbers.filter(v => v > average);
    const belowAverage = validNumbers.filter(v => v < average);

    // Percentiles: 10, 25, 50, 75, 90
    const percentiles = {
      "10": Number(percentile(sorted, 10).toFixed(2)),
      "25": Number(percentile(sorted, 25).toFixed(2)),
      "50": Number(percentile(sorted, 50).toFixed(2)),
      "75": Number(percentile(sorted, 75).toFixed(2)),
      "90": Number(percentile(sorted, 90).toFixed(2))
    };

    // Set analysis results
    setAnalysis({
      sum,
      average: Number(average.toFixed(2)),
      maximum,
      minimum,
      range,
      median: Number(median.toFixed(2)),
      count: validNumbers.length,
      stdDev: Number(stdDev.toFixed(2)),
      aboveAverage,
      belowAverage,
      percentiles
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <CardTitle className="text-2xl">Data Analysis Tool</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Dataset Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Choose Dataset:</label>
            {/* allow multiple selection to combine datasets */}
            <select
              multiple
              value={currentDataset}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                setCurrentDataset(options);
              }}
              className="w-full p-2 border rounded h-36 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="temperatures">Temperatures (°F)</option>
              <option value="testScores">Test Scores</option>
              <option value="salesFigures">Sales Figures ($)</option>
            </select>
          </div>

          {/* Current Dataset Display */}
          <div className="p-3 bg-gray-50 rounded text-sm">
            <strong>Data (combined):</strong> {getSelectedData(currentDataset).join(', ')}
          </div>

          {/* Analyze Button */}
          <Button onClick={analyzeData} className="w-full">Analyze Data</Button>

          {/* Results or Error */}
          {analysis && (
            <div>
              {analysis.error ? (
                // Error Message
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{analysis.error}</span>
                </div>
              ) : (
                // Statistics Grid
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Analysis Results:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 font-medium">Sum</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.sum}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-gray-600 font-medium">Average</p>
                      <p className="text-lg font-bold text-green-600">{analysis.average}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs text-gray-600 font-medium">Minimum</p>
                      <p className="text-lg font-bold text-purple-600">{analysis.minimum}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-xs text-gray-600 font-medium">Maximum</p>
                      <p className="text-lg font-bold text-red-600">{analysis.maximum}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs text-gray-600 font-medium">Median</p>
                      <p className="text-lg font-bold text-yellow-600">{analysis.median}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
                      <p className="text-xs text-gray-600 font-medium">Range</p>
                      <p className="text-lg font-bold text-indigo-600">{analysis.range}</p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded border border-teal-200">
                      <p className="text-xs text-gray-600 font-medium">Count</p>
                      <p className="text-lg font-bold text-teal-600">{analysis.count}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-xs text-gray-600 font-medium">Standard Deviation (sample)</p>
                      <p className="text-lg font-bold text-slate-700">{analysis.stdDev}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded border border-emerald-200 col-span-2">
                      <p className="text-xs text-gray-600 font-medium">Percentiles (10/25/50/75/90)</p>
                      <p className="text-sm text-emerald-700">
                        {analysis.percentiles ? `${analysis.percentiles["10"]} / ${analysis.percentiles["25"]} / ${analysis.percentiles["50"]} / ${analysis.percentiles["75"]} / ${analysis.percentiles["90"]}` : '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-cyan-50 rounded border border-cyan-200 col-span-2">
                      <p className="text-xs text-gray-600 font-medium">Above Average ({analysis.aboveAverage?.length})</p>
                      <p className="text-sm text-cyan-700">{analysis.aboveAverage?.slice(0, 20).join(', ')}{analysis.aboveAverage && analysis.aboveAverage.length > 20 ? ', ...' : ''}</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded border border-rose-200 col-span-2">
                      <p className="text-xs text-gray-600 font-medium">Below Average ({analysis.belowAverage?.length})</p>
                      <p className="text-sm text-rose-700">{analysis.belowAverage?.slice(0, 20).join(', ')}{analysis.belowAverage && analysis.belowAverage.length > 20 ? ', ...' : ''}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial State Message */}
          {!analysis && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Select a dataset and click "Analyze Data" to see statistics
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataAnalyzer;