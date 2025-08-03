'use client'

import Head from 'next/head'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip } from 'recharts'
import { Navbar1 } from '@/components/ui/Header'
import { Hero1 } from '@/components/hero1'


export default function Home() {
  const patientGrowth = [
    { month: 'Jan', patients: 120 },
    { month: 'Feb', patients: 200 },
    { month: 'Mar', patients: 250 },
    { month: 'Apr', patients: 300 },
    { month: 'May', patients: 350 },
    { month: 'Jun', patients: 400 },
  ]
  const revenue = [
    { month: 'Jan', revenue: 5 },
    { month: 'Feb', revenue: 8 },
    { month: 'Mar', revenue: 12 },
    { month: 'Apr', revenue: 15 },
    { month: 'May', revenue: 18 },
    { month: 'Jun', revenue: 22 },
  ]
  const chartConfig1 = { growth: { label: 'Patients', color: 'var(--chart-1)' } }
  const chartConfig2 = { rev: { label: 'Revenue ($k)', color: 'var(--chart-2)' } }

  return (
    <>
      <Head>
        <title>HealthSync Analytics</title>
        <meta name="description" content="Healthcare SaaS dashboard using shadcn UI and Tailwind CSS" />
      </Head>
      <header className='w-full mx-auto fixed bg-background z-50 shadow-md'>
        <Navbar1 />
      </header>
      <main className="container mx-auto pt-20">
        {/* Hero */}
        <Hero1 />

        {/* Features */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Patient Management</h3>
              <p className="text-gray-600">Track history, appointments, billing in one dashboard.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Secure Data</h3>
              <p className="text-gray-600">HIPAA‑compliant, encrypted data platform.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Analytics Insights</h3>
              <p className="text-gray-600">Real-time charts and actionable dashboards.</p>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto space-y-16">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Patient Growth</h2>
              <ChartContainer className="w-full h-[300px]" config={chartConfig1}>
                <BarChart data={patientGrowth}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                  <Bar dataKey="patients" fill="var(--chart-1)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-6">Monthly Revenue</h2>
              <ChartContainer className="w-full h-[300px]" config={chartConfig2}>
                <BarChart data={revenue}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                  <Bar dataKey="revenue" fill="var(--chart-2)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-green-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to improve patient care?</h2>
          <p className="mb-6 text-lg max-w-xl mx-auto">Start your free 14‑day trial. No credit card needed.</p>
          <Button variant="secondary" size="lg">Start Free Trial</Button>
        </section>
      </main>
    </>
  )
}
