const fs = require('fs');

const path = 'src/app/kpi/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const MOCK_HOSPITALS = [
  'รพ.สต.ศาลาลำดวน', 'รพ.สต.บ้านสระแก้ว', 'รพ.สต.ท่าเกษม', 'รพ.สต.สระขวัญ', 'รพ.สต.หนองบอน'
];

const subdistrictBlock = `
      {activeTab === 'subdistrict' && (
        <div className="card" style={{ flex: 1, overflow: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ตารางสถานะตัวชี้วัดระดับ รพ.สต. (รอดึงข้อมูลจาก HDC Open Data)</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>*ข้อมูลจำลองเพื่อการทดสอบ</div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', width: '350px' }}>ชื่อตัวชี้วัด</th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', backgroundColor: '#f8fafc' }}>รวม รพ.สต.</th>
                  ${MOCK_HOSPITALS.map(h => `<th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--border)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '120px' }}>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                {filteredKpis.filter(k => k.measurement_level === 'subdistrict' || k.measurement_level === 'province').map((kpi, idx) => {
                  const getBgColor = (status: string) => status === 'success' ? '#dcfce7' : status === 'warning' ? '#fef08a' : status === 'pending' ? '#e2e8f0' : '#fee2e2';
                  const getTextColor = (status: string) => status === 'success' ? '#166534' : status === 'warning' ? '#854d0e' : status === 'pending' ? '#475569' : '#991b1b';
                  
                  // Mock random status for UI demonstration
                  const mockStatuses = ['success', 'warning', 'error', 'pending'];
                  const overallMockStatus = mockStatuses[idx % 4];
                  
                  return (
                    <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border)', fontWeight: 500 }}>
                        <div style={{ marginBottom: '0.25rem' }}><span style={{color:'var(--primary)'}}>[{kpi.auto_id}]</span> {kpi.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{kpi.responsible_group}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderRight: '2px solid var(--border)', backgroundColor: getBgColor(overallMockStatus), color: getTextColor(overallMockStatus), fontWeight: 700 }}>
                        {overallMockStatus === 'success' ? 'ผ่าน' : overallMockStatus === 'pending' ? 'รอดำเนินการ' : overallMockStatus === 'warning' ? 'เฝ้าระวัง' : 'ไม่ผ่าน'}
                      </td>
                      ${MOCK_HOSPITALS.map((_, hIdx) => {
                        return `
                        <td style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: getBgColor(mockStatuses[(idx + hIdx) % 4]), margin: '0 auto' }}></div>
                        </td>`;
                      }).join('')}
                    </tr>
                  );
                })}
                {filteredKpis.filter(k => k.measurement_level === 'subdistrict' || k.measurement_level === 'province').length === 0 && (
                  <tr>
                    <td colSpan={${MOCK_HOSPITALS.length + 2}} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                      ไม่พบตัวชี้วัดที่ประเมินระดับ รพ.สต.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

content = content.replace("{activeTab === 'detail' && (", subdistrictBlock + "\n      {activeTab === 'detail' && (");

fs.writeFileSync(path, content);
