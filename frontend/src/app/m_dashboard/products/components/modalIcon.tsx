
// export const TabIcon = ({ type }: { type: string }) => {
//   const iconClass = 'w-5 h-5';

//   switch (type) {
//     case 'basic':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <path d="M11 4a7 7 0 0 0 0 14H4a7 7 0 0 0 0-14h7z" />
//           <path d="M7 8v4m4-4v4" />
//         </svg>
//       );
//     case 'pricing':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <circle cx="12" cy="12" r="9" />
//           <path d="M12 6v12m3-3H9" />
//         </svg>
//       );
//     case 'image':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <rect x="3" y="3" width="18" height="18" rx="2" />
//           <circle cx="8.5" cy="8.5" r="1.5" />
//           <path d="m21 15-5-5-6 6-7-7" />
//         </svg>
//       );
//     case 'inventory':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
//           <path d="M9 9h6m-6 3h6" />
//         </svg>
//       );
//     case 'variants':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <circle cx="12" cy="12" r="1" />
//           <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
//         </svg>
//       );
//     case 'info':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <circle cx="12" cy="12" r="10" />
//           <path d="M12 16v-4M12 8h.01" />
//         </svg>
//       );
//     case 'shipping':
//       return (
//         <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
//           <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
//           <polyline points="9 22 9 12 15 12 15 22" />
//         </svg>
//       );
//     default:
//       return null;
//   }
// };