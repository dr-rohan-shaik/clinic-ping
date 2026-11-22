'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Monitor, Workflow, Database, Settings, CheckCircle, AlertCircle } from 'lucide-react';
const SERVICES = [
    {
        name: 'ClinicPing Web',
        description: 'Main clinic management dashboard',
        url: '/dashboard',
        port: 3000,
        required: true,
        healthEndpoint: '/api/health',
        status: 'active',
    },
    {
        name: 'n8n',
        description: 'Workflow automation for WhatsApp reminders',
        url: '/n8n',
        port: 5678,
        required: true,
        healthEndpoint: '/healthz',
        status: 'pending',
    },
    {
        name: 'pgAdmin',
        description: 'PostgreSQL database administration',
        url: '/pgadmin',
        port: 5050,
        required: false,
        healthEndpoint: '/misc/status',
        status: 'pending',
    },
];
export default function SetupPage() {
    const [copied, setCopied] = useState(false);
    const copyToClipboard = async (text) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const checkServiceStatus = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
            default:
                return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
        }
    };
    const getServiceName = (name, required) => {
        return required ? `${name} *` : `${name}`;
    };
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ClinicPing Setup Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Monitor and manage all ClinicPing services in one place
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-full">
            <Settings className="h-4 w-4"/>
            <span className="font-medium">v1.0.0</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard" className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Monitor className="h-6 w-6 text-orange-600 dark:text-orange-400"/>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Dashboard</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Main ClinicPing application
              </p>
            </Link>

            <div onClick={() => copyToClipboard('http://localhost:5678')} className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Workflow className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">n8n</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click to copy URL</p>
                </div>
                {copied && <CheckCircle className="h-5 w-5 text-green-500"/>}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Workflow automation - http://localhost:5678
              </p>
            </div>

            <div onClick={() => copyToClipboard('http://localhost:5050')} className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">pgAdmin</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click to copy URL</p>
                </div>
                {copied && <CheckCircle className="h-5 w-5 text-green-500"/>}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Database admin - http://localhost:5050
              </p>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Service Status</h2>

          <div className="space-y-4">
            {SERVICES.map((service) => (<div key={service.name} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                      {service.name === 'ClinicPing Web' && <Monitor className="h-5 w-5 text-gray-600"/>}
                      {service.name === 'n8n' && <Workflow className="h-5 w-5 text-gray-600"/>}
                      {service.name === 'pgAdmin' && <Database className="h-5 w-5 text-gray-600"/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getServiceName(service.name, service.required)}
                        </h3>
                        {service.required && <span className="text-red-500">*</span>}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {service.description}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">
                        Port: {service.port} | Health: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{service.healthEndpoint}</code>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${checkServiceStatus(service.status)}`}>
                      {service.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>))}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600"/>
            Setup Instructions
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Start all services</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Run <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">docker compose up -d</code> in the project root
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Seed the database</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Access pgAdmin at <code>http://localhost:5050</code> and run the seed script or use the setup wizard
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Create admin account</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Sign up as owner to get full access to all features
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
