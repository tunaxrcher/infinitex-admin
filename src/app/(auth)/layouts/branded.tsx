import { ReactNode } from 'react';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';

export function BrandedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>
        {`
          .branded-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/1.png')}');
          }
          .dark .branded-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/1-dark.png')}');
          }
        `}
      </style>
      <div className="grid lg:grid-cols-2 grow">
        <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1">
          <Card className="w-full max-w-[400px]">
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>

        <div className="lg:rounded-xl lg:border lg:border-border lg:m-5 order-1 lg:order-2 bg-top xxl:bg-center xl:bg-cover bg-no-repeat branded-bg">
          <div className="flex flex-col p-8 lg:p-16 gap-4">
            {/* <Link href="/">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo.svg')}
                className="h-[28px] max-w-none"
                alt=""
              />
            </Link> */}

            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-semibold">
                ระบบจัดการข้อมูลของ InfiniteX
              </h3>
              <div className="text-base font-medium text-secondary-foreground">
                ระบบจัดการหลังบ้านสำหรับการบริหารจัดการ
                <br />
                <span className="font-semibold">
                  สินเชื่อ ลูกค้า และข้อมูลต่างๆ
                </span>
                <br />
                อย่างมีประสิทธิภาพและปลอดภัย
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
