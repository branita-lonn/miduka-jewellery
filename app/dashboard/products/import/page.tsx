// app/dashboard/products/import/page.tsx
// UI for bulk product CSV import with client-side preview.

"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportProductRow {
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  categorySlug: string;
  tags?: string;
  stockQuantity?: string;
  isActive?: string;
  isFeatured?: string;
  isOnSale?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
}

interface ImportResults {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export default function ProductImportPage() {
  const [data, setData] = useState<ImportProductRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    setIsParsing(true);
    setImportResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data as ImportProductRow[]);
        setHeaders(results.meta.fields || []);
        setIsParsing(false);
        toast.success(`Successfully parsed ${results.data.length} rows`);
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        toast.error("Failed to parse CSV file");
        setIsParsing(false);
      }
    });
  };

  const startImport = async () => {
    if (data.length === 0) return;

    setIsImporting(true);
    try {
      const response = await fetch("/api/dashboard/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: data }),
      });

      if (!response.ok) throw new Error("Import failed");

      const results: ImportResults = await response.json();
      setImportResults(results);
      
      if (results.imported > 0) {
        toast.success(`Successfully imported ${results.imported} products`);
      }
      if (results.skipped > 0) {
        toast.warning(`${results.skipped} rows were skipped`);
      }
    } catch (error) {
      toast.error("An error occurred during import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-muted-foreground">Upload a CSV file to add multiple products at once</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 rounded-3xl border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
            <CardDescription>Follow these steps to ensure a smooth import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">1</div>
              <p>Download the <Link href="/product-import-template.csv" className="text-primary font-bold hover:underline">template CSV</Link>.</p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">2</div>
              <p>Fill in your product data. <span className="font-bold">name</span>, <span className="font-bold">price</span>, and <span className="font-bold">categorySlug</span> are mandatory.</p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">3</div>
              <p>Ensure <span className="font-bold">categorySlug</span> matches an existing category's slug.</p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">4</div>
              <p>Upload the file and preview the data below before confirming.</p>
            </div>
            
            <Alert variant="default" className="bg-primary/5 border-primary/20 rounded-2xl">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-bold">Slug Generation</AlertTitle>
              <AlertDescription className="text-xs text-primary/80">
                Slugs are auto-generated from product names. If a slug exists, a random suffix is added.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-3xl border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upload CSV</CardTitle>
            <CardDescription>Select your prepared file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="csv-upload" 
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-3xl cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                  )}
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV (max. 5MB)</p>
                </div>
                <input 
                  id="csv-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isParsing || isImporting}
                />
              </label>
            </div>

            {data.length > 0 && !importResults && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div>
                  <p className="text-sm font-bold">{data.length} products ready to import</p>
                  <p className="text-xs text-muted-foreground">Review the preview below</p>
                </div>
                <Button 
                  onClick={startImport} 
                  disabled={isImporting}
                  className="rounded-xl shadow-lg px-6"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Confirm Import"
                  )}
                </Button>
              </div>
            )}

            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Processing batch...</span>
                  <span>Keep this page open</span>
                </div>
                <Progress value={undefined} className="h-1" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {importResults && (
        <Alert className={resultsVariant(importResults)}>
          <div className="flex items-center gap-2">
            {importResults.errors.length === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <AlertTitle className="font-bold">Import Completed</AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 p-3 rounded-xl">
                <p className="text-xs uppercase tracking-wider opacity-70">Imported</p>
                <p className="text-2xl font-bold">{importResults.imported}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <p className="text-xs uppercase tracking-wider opacity-70">Skipped</p>
                <p className="text-2xl font-bold">{importResults.skipped}</p>
              </div>
              {importResults.errors.length > 0 && (
                <div className="col-span-full">
                  <p className="text-sm font-bold mb-2">Error Details:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside opacity-90">
                    {importResults.errors.map((err, idx) => (
                      <li key={idx}>Row {err.row}: {err.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {data.length > 0 && !importResults && (
        <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Data Preview (First 5 Rows)</CardTitle>
            <CardDescription>Verify your data before finalising</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.slice(0, 8).map((h) => (
                      <TableHead key={h} className="text-xs uppercase font-bold">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{row.description}</TableCell>
                      <TableCell className="text-sm">{row.price}</TableCell>
                      <TableCell className="text-sm">{row.compareAtPrice}</TableCell>
                      <TableCell className="text-sm font-mono text-primary">{row.categorySlug}</TableCell>
                      <TableCell className="text-sm">{row.tags}</TableCell>
                      <TableCell className="text-sm">{row.stockQuantity}</TableCell>
                      <TableCell className="text-sm">{row.isActive}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function resultsVariant(results: ImportResults) {
  if (results.errors.length === 0) return "bg-emerald-500 text-white border-none rounded-3xl shadow-xl";
  if (results.imported > 0) return "bg-amber-500 text-white border-none rounded-3xl shadow-xl";
  return "bg-rose-500 text-white border-none rounded-3xl shadow-xl";
}
