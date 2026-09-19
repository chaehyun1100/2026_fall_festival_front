import { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal'
import { getLanternBoothOptions } from '../../../api/lantern'

const largeModalStyle = {
  display: 'flex',
  width: '305px',
  padding: '28px 16px 16px 16px',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px',
  borderRadius: '12px',
  background: '#FFF',
  boxShadow:
    '0 3px 6px 0 rgba(255, 161, 161, 0.25), 0 -4px 6px 0 rgba(194, 255, 175, 0.25), 0 0 6px 0 rgba(243, 246, 188, 0.75)',
};

export default function CreateLanternModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  boothList = [],
  currentCount = 0, // 현재 작성한 등불 개수
}) {
  const [selectedBooth, setSelectedBooth] = useState('');
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fetchedBoothList, setFetchedBoothList] = useState([]);
  const [isBoothListLoading, setIsBoothListLoading] = useState(false);

  // 모달이 열릴 때마다 당일 운영 부스 목록을 새로 받아온다 (지도팀 소관 GET /api/booths/,
  // 여긴 부스 선택 드롭다운 전용으로만 사용 — place_type=BOOTH만 등불을 달 수 있음)
  useEffect(() => {
    if (!isOpen || boothList.length > 0) return;

    let cancelled = false;
    setIsBoothListLoading(true);

    getLanternBoothOptions()
      .then((res) => {
        if (cancelled) return;
        const booths = res.data?.data?.booths ?? [];
        setFetchedBoothList(
          booths
            .filter((booth) => booth.place_type === 'BOOTH')
            .map((booth) => ({ id: booth.booth_id, name: booth.name }))
        );
      })
      .catch(() => {
        if (!cancelled) setFetchedBoothList([]);
      })
      .finally(() => {
        if (!cancelled) setIsBoothListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, boothList.length]);

  const resolvedBoothList = boothList.length > 0 ? boothList : fetchedBoothList;

  // 폼 초기화
  const resetForm = () => {
    setSelectedBooth('');
    setNickname('');
    setContent('');
    setSubmitError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 입력값 검증: 부스 선택 + 축제 한마디 작성 시에만 버튼 활성화
  const isValid = selectedBooth !== '' && content.trim().length > 0;

  // onSubmitSuccess는 부모(useCreateLanternFlow)에서 실제 등록 API를 호출하고,
  // 실패 시 { field, message } 형태로 reject해서 인라인 에러로 보여준다.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    if (!onSubmitSuccess) return;

    // 닉네임 안 적은 경우 '익명의 코끼리' 적용
    const finalNickname = nickname.trim() || '익명의 코끼리';

    const lanternData = {
      boothId: selectedBooth,
      nickname: finalNickname,
      message: content.trim(),
    };

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSubmitSuccess(lanternData);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err?.message || '등불 등록에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={largeModalStyle}>
      {/* Header */}
      <div style={{ textAlign: 'left', width: '100%', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#111' }}>
          등불 달기 ({Math.min(currentCount + 1, 3)}/3)
        </h2>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', margin: 0, fontWeight: '500' }}>
          축제 한 마디 남기고 부스 응원하기
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 부스 선택 드롭다운 */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#333' }}>
            부스 선택
          </label>
          <select
            value={selectedBooth}
            onChange={(e) => setSelectedBooth(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              color: selectedBooth ? '#111' : '#aaa',
            }}
          >
            <option value="" disabled hidden>
              {isBoothListLoading ? '부스 목록을 불러오는 중...' : '부스를 선택해주세요'}
            </option>
            {resolvedBoothList.map((booth) => (
              <option key={booth.id} value={booth.id} style={{ color: '#111' }}>
                {booth.name}
              </option>
            ))}
          </select>
        </div>

        {/* 닉네임 입력 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              닉네임 <span style={{ fontWeight: 'normal', color: '#aaa' }}>(선택)</span>
            </label>
            <span style={{ fontSize: '10px', color: '#aaa' }}>{nickname.length}/5</span>
          </div>
          <input
            type="text"
            maxLength={5}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="입력 안 한 경우 → 익명의 코끼리"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 축제 한마디 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              축제 한마디
            </label>
            <span style={{ fontSize: '10px', color: '#aaa' }}>{content.length}/30</span>
          </div>
          <textarea
            maxLength={30}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="축제 한 마디를 적어주세요"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              fontSize: '12px',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <p style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.3', margin: 0 }}>
          ⓘ 등불은 하루 최대 3개까지 달 수 있어요. 삭제한 등불도 횟수에 포함돼요.
        </p>

        {submitError && (
          <p style={{ fontSize: '11px', color: '#e53935', margin: 0 }}>{submitError}</p>
        )}

        {/* Footer 버튼 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f4f4f4',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#555',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
          
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isValid && !isSubmitting ? '#1e1e1e' : '#ccc',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#ffffff',
              cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
          >
            {isSubmitting ? '등록 중...' : '등불 달기'}
          </button>
        </div>
      </form>
    </Modal>
  );
}